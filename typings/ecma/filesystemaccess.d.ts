/**
 * @file filesystemaccess.d.ts
 */

declare class FileSystemWritableFileStream extends WritableStream {
  constructor();

  seek(position): Promise<void>;
/**
 * 足りないバイトは null で埋める
 * @param size unsigned long
 */
  truncate(size): Promise<void>;
/**
 * data を直接指定するかオブジェクトでその他も指定する。
 * ArrayBuffer, TypedArray, DataView, Blob, String
 * { "type": "truncate", "position": 0, "size": 64, "data": data }
 * @param data data または object
 */
  write(data);

  close();
}

declare class FileSystemHandle {
  constructor();
/**
 * 'file' or 'directory'
 */
  readonly kind: string;
  readonly name: string;
/**
 * 非標準。fiefox だけ。chrome, edge には無い
 */
  move();
/**
 * 非標準。chrome, edge など
 */
  remove();
}

/**
 * ファイル操作ハンドル
 */
declare class FileSystemFileHandle extends FileSystemHandle {
  constructor();
  createSyncAccessHandle();
  createWritable(): Promise<FileSystemWritableFileStream>;
/**
 * File として取得する
 */
  getFile(): Promise<File>;
}

/**
 * ディレクトリ操作ハンドル
 */
declare class FileSystemDirectoryHandle extends FileSystemHandle {
  constructor();

/**
 * 
 * @param name 
 * @param {{create?: boolean}} opt create: true とすると無い場合に生成する
 */
  getDirectoryHandle(name: string, opt: {}): Promise<FileSystemDirectoryHandle>;
/**
 * 
 * @param name 
 * @param {{create?: boolean}} opt create: true とすると無い場合に生成する
 */
  getFileHandle(name: string, opt: {}): Promise<FileSystemFileHandle>;
  keys();
  removeEntry();
  resolve();
  values();
}

/**
 * 
 * @param {{mode?: string}} opt mode: 'readwrite' にすると読み書きできる 
 * @param {string?} opt.mode 'readwrite' にすると読み書きできる
 * @param {string|FileSystemHandle} opt.startIn 初期位置指定
 * string の場合は、"music", "pictures", "videos" など
 */
declare function showDirectoryPicker(opt: {mode?: string}): Promise<FileSystemDirectoryHandle>;


declare function showOpenFilePicker(opt: {}): Promise<FileSystemFileHandle[]>;


