class BufferedSerial {
  constructor(serial) {
    this.serial = serial;
    this.serial.on("data", (chunk) => {
      // Ensure capacity before appending
      const needed = this.length + chunk.length;
      if (needed > this.buffer.length) {
        let newCap = this.buffer.length;
        while (newCap < needed) newCap *= 2;
        const nb = new Uint8Array(newCap);
        nb.set(this.buffer.subarray(0, this.length), 0);
        this.buffer = nb;
      }
      this.buffer.set(chunk, this.length);
      this.length += chunk.length;
    });

    this.buffer = new Uint8Array(4096);
    this.length = 0;
  }

  write(data) {
    return new Promise((resolve, reject) => {
      this.serial.write(data, (err) => {
        if (err) {
          reject(err);
        } else {
          this.serial.drain((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      });
    });
  }

  clear() {
    this.buffer.fill(0);
    this.length = 0;
  }

  available() {
    return this.length;
  }

  read(size) {
    if (typeof size !== "number") {
      size = this.buffer.length + 1;
    }
    if (this.length < size) {
      return null;
    } else {
      let buf = new Uint8Array(size);
      for (let i = 0; i < size; i++) {
        buf[i] = this.buffer[i];
      }
      this.buffer.copyWithin(0, size, this.length);
      this.length -= size;
      return buf;
    }
  }

  async readAwait(size) {
    while (true) {
      await this.wait(1);
      let r = this.read(size);
      if (r && r.length === size) {
        return r;
      }
    }
  }

  async readAwaitWithTimeout(size, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await this.wait(1);
      const r = this.read(size);
      if (r && r.length === size) {
        return r;
      }
    }
    return null;
  }

  wait(t) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, t);
    });
  }

  getData(offset, length) {
    let buf = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      buf[i] = this.buffer[offset + i];
    }
    return buf;
  }
}

exports.BufferedSerial = BufferedSerial;
