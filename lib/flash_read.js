const fs = require("fs");
const path = require("path");
const { BufferedSerial } = require("../util/buffered-serial");

/**
 * Read user code from device and save to file
 * @param {SerialPort} serial The serial port where device connected
 * @param {string} destPath Output file path
 * @param {function} packetCallback
 * @returns {Promise}
 */
function flashRead(serial, destPath, packetCallback, opts = {}) {
  return new Promise((resolve, reject) => {
    const bs = new BufferedSerial(serial);

    async function getSize(timeoutMs = 3000) {
      // Ensure echo is off and clear buffer; request size; parse integer
      await bs.write("\r.echo off\r");
      await bs.wait(10);
      bs.clear();
      await bs.write("\r.flash -s\r");
      const start = Date.now();
      let parsed = null;
      let acc = "";
      while (Date.now() - start < timeoutMs) {
        await bs.wait(10);
        const avail = bs.available();
        if (avail > 0) {
          const buf = bs.read(avail);
          acc += Buffer.from(buf).toString("utf8");
          const cleaned = acc.replace(/\x1B\[[0-?]*[ -\/]*[@-~]/g, "");
          const lines = cleaned.split(/[\r\n]+/).map((l) => l.trim());
          const nums = lines.filter((l) => /^\d{1,12}$/.test(l));
          if (nums.length > 0) {
            parsed = parseInt(nums[nums.length - 1], 10);
            break;
          }
        }
      }
      if (parsed == null || isNaN(parsed)) throw new Error("Failed to read flash size");
      return parsed;
    }

    async function readExact(size) {
      // Issue read command and reconstruct original newlines from CRLF.
      bs.clear();
      await bs.write("\r.flash -r\r");
      await bs.wait(50);
      const useStdout = opts.stdout || destPath === "-";
      const fd = useStdout ? null : fs.openSync(path.resolve(destPath), "w");
      let written = 0;
      let prevCR = false;
      try {
        while (written < size) {
          // Read up to remaining bytes (never over-request or we may time out)
          const req = Math.max(1, Math.min(512, size - written));
          const chunk = await bs.readAwaitWithTimeout(req, 2000);
          if (!chunk || chunk.length === 0) {
            // If we timed out but already have enough, break
            if (written >= size) break;
            throw new Error("Timeout waiting for data");
          }
          // Process bytes to strip ANSI and collapse CRLF -> LF
          const out = [];
          let i = 0;
          while (i < chunk.length) {
            let b = chunk[i];
            // Strip ANSI escape sequences (CSI): ESC [ ... final-byte
            if (b === 0x1b /* ESC */ && i + 1 < chunk.length && chunk[i + 1] === 0x5b /* [ */) {
              i += 2;
              while (i < chunk.length) {
                const c = chunk[i];
                if (c >= 0x40 && c <= 0x7e) { i++; break; } // final byte
                i++;
              }
              continue;
            }
            // Normal processing with CRLF normalization
            if (prevCR) {
              if (b === 0x0a) { // CRLF -> LF
                out.push(0x0a);
                prevCR = false;
                i++;
                continue;
              } else {
                out.push(0x0d);
                prevCR = false;
              }
            }
            if (b === 0x0d) {
              prevCR = true;
            } else {
              out.push(b);
            }
            i++;
          }
          // If buffer ends with CR and we still need data, keep prevCR set, otherwise flush it
          if (prevCR && written + out.length >= size) {
            // We reached or will reach size; ensure CR counts if needed
            if (written + out.length < size) {
              out.push(0x0d);
              prevCR = false;
            }
          }
          // Write only up to remaining bytes
          const need = size - written;
          const toWrite = Buffer.from(out.slice(0, need));
          if (toWrite.length > 0) {
            if (useStdout) {
              process.stdout.write(toWrite);
            } else {
              fs.writeSync(fd, toWrite);
            }
            written += toWrite.length;
            if (packetCallback) packetCallback(toWrite.length, size - written);
          }
        }
      } finally {
        if (fd !== null) fs.closeSync(fd);
      }
      return { destPath, totalBytes: size, receivedBytes: written };
    }

    (async () => {
      try {
        const size = await getSize();
        const result = await readExact(size);
        // restore echo
        await bs.write("\r.echo on\r");
        resolve(result);
      } catch (e) {
        try { await bs.write("\r.echo on\r"); } catch (_) {}
        reject(e);
      }
    })();
  });
}

module.exports = flashRead;
