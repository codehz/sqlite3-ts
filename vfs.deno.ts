import type { VFS } from "./types.ts";

const SQLITE_OPEN_READONLY = 1;
const SQLITE_OPEN_READWRITE = 2;
const SQLITE_OPEN_CREATE = 4;

function mapFlags(flags: number): Deno.OpenOptions {
  const ret: Deno.OpenOptions = {};
  if (flags & SQLITE_OPEN_READWRITE) {
    ret.read = true;
    ret.write = true;
  } else if (flags & SQLITE_OPEN_READONLY) {
    ret.read = true;
  }
  if (flags & SQLITE_OPEN_CREATE) {
    ret.create = true;
  }
  return ret;
}

export default {
  access(filename: string, _flags: number): number {
    try {
      const file = Deno.openSync(filename, { read: true, write: true });
      file.close();
      return 1;
    } catch {
      return 0;
    }
  },
  open(filename: string, flags: number): number {
    try {
      const file = Deno.openSync(filename, mapFlags(flags));
      return file.rid;
    } catch {
      return 0;
    }
  },
  close(fd: number) {
    Deno.close(fd);
  },
  unlink(filename: string): number {
    try {
      Deno.removeSync(filename);
      return 1;
    } catch {
      return 0;
    }
  },
  read(fd: number, buffer: Uint8Array, offset: number): number {
    const file = new Deno.File(fd);
    file.seekSync(offset, Deno.SeekMode.Start);
    return file.readSync(buffer) ?? 0;
  },
  write(fd: number, buffer: Uint8Array, offset: number): number {
    const file = new Deno.File(fd);
    file.seekSync(offset, Deno.SeekMode.Start);
    return file.writeSync(buffer) ?? -1;
  },
  truncate(fd: number, newlength: number) {
    const file = new Deno.File(fd);
    file.truncateSync(newlength);
  },
  filesize(fd: number): number {
    const file = new Deno.File(fd);
    return file.seekSync(0, Deno.SeekMode.End);
  },
} as VFS;
