import type { VFS } from "./types.ts";

const SQLITE_OPEN_CREATE = 4;

const PAGE_SIZE = 64 * 1024;

function roundToPageSize(n: number): number {
  return Math.ceil(n / PAGE_SIZE);
}

export class VirtualFile {
  #memory: WebAssembly.Memory;
  size = 0;
  get view() {
    return new Uint8Array(this.#memory.buffer, 0, this.size);
  }

  constructor(initial?: Uint8Array) {
    if (initial) {
      this.#memory = new WebAssembly.Memory({
        initial: roundToPageSize(initial.byteLength),
      });
      this.size = initial.byteLength;
      this.view.set(initial);
    } else {
      this.#memory = new WebAssembly.Memory({ initial: 1 });
    }
  }

  truncate(newsize: number) {
    if (newsize < this.size) {
      this.size = newsize;
    } else {
      throw new RangeError("new size larger than origin size");
    }
  }

  #ensure(newsize: number) {
    const cap = this.#memory.buffer.byteLength;
    if (cap < newsize) {
      this.#memory.grow(roundToPageSize(newsize - cap));
    }
    this.size = newsize;
  }

  read(buffer: Uint8Array, offset: number): number {
    if (offset < 0) throw new RangeError("offset underflow");
    if (offset >= this.size) {
      return 0;
    }
    const maxread = Math.min(this.size, offset + buffer.length) - offset;
    buffer.set(new Uint8Array(this.#memory.buffer, offset, maxread));
    return maxread;
  }

  write(buffer: Uint8Array, offset: number) {
    if (offset < 0) throw new RangeError("offset underflow");
    this.#ensure(offset + buffer.length);
    this.view.set(buffer, offset);
  }
}

export const root = new Map<string, VirtualFile>();

const fds = new Map<number, VirtualFile>();

function allocFd() {
  let fd = 1;
  while (fds.has(fd)) fd++;
  return fd;
}

export default {
  access(filename: string, _flags: number): number {
    return root.has(filename) ? 1 : 0;
  },
  open(filename: string, flags: number): number {
    let file = root.get(filename);
    if (!file) {
      if (!(flags & SQLITE_OPEN_CREATE)) return 0;
      file = new VirtualFile();
      root.set(filename, file);
    }
    const fd = allocFd();
    fds.set(fd, file);
    return fd;
  },
  close(fd: number) {
    fds.delete(fd);
  },
  unlink(filename: string): number {
    root.delete(filename);
    return 1;
  },
  read(fd: number, buffer: Uint8Array, offset: number): number {
    return fds.get(fd)?.read(buffer, offset) ?? 0;
  },
  write(fd: number, buffer: Uint8Array, offset: number): number {
    return fds.get(fd)?.write(buffer, offset) ?? 0;
  },
  truncate(fd: number, newsize: number) {
    fds.get(fd)?.truncate(newsize);
  },
  filesize(fd: number): number {
    return fds.get(fd)?.size ?? 0;
  },
} as VFS;
