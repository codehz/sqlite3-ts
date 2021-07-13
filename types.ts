export interface VFS {
  access(filename: string, flags: number): number;
  open(filename: string, flags: number): number;
  close(fd: number): void;
  unlink(filename: string): number;
  read(fd: number, buffer: Uint8Array, offset: number): number;
  write(fd: number, buffer: Uint8Array, offset: number): number;
  truncate(fd: number, newlength: number): void;
  filesize(fd: number): number;
}
