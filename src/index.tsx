import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-media-library' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const MediaLibrary = NativeModules.MediaLibrary
  ? NativeModules.MediaLibrary
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

MediaLibrary.install();

declare global {
  var __mediaLibrary: {
    getAsset(
      id: string,
      callback: (item: FullAssetItem | undefined) => void
    ): void;
    getAssets(
      options: Options | string,
      callback: (item: AssetItem[]) => void
    ): void;
    saveToLibrary(
      localUrl: string,
      album: string,
      callback: (item: AssetItem | string) => void
    ): void;
  };
}

interface Options {
  mediaType?: MediaType[];
  sortBy?: 'creationTime' | 'modificationTime';
  sortOrder?: 'asc' | 'desc';
  extensions?: string[];
  requestUrls?: boolean;
  limit?: number;
}

export type MediaType = 'photo' | 'video' | 'audio' | 'unknown';
export interface AssetItem {
  readonly filename: string;
  readonly id: string;
  readonly creationTime: number;
  readonly modificationTime: number;
  readonly mediaType: MediaType;
  readonly duration: number;
  readonly width: number;
  readonly height: number;
  readonly uri: string;
  readonly url?: string;
}

export interface FullAssetItem extends AssetItem {
  readonly url: string;
}

export const mediaLibrary = {
  getAssets(options?: Options): Promise<AssetItem[]> {
    const params = {
      mediaType: options?.mediaType,
      sortBy: options?.sortBy,
      sortOrder: options?.sortOrder,
      extensions: options?.extensions,
      requestUrls: options?.requestUrls ?? false,
      limit: options?.limit,
    };
    return new Promise<AssetItem[]>((resolve) => {
      __mediaLibrary.getAssets(
        Platform.OS === 'android' ? JSON.stringify(params) : params,
        (response) => resolve(response)
      );
    });
  },

  getAsset(id: string): Promise<FullAssetItem | undefined> {
    return new Promise<FullAssetItem | undefined>((resolve) => {
      __mediaLibrary.getAsset(id, (response) => resolve(response));
    });
  },

  saveToLibrary(localUrl: string, album?: string) {
    return new Promise((resolve) => {
      __mediaLibrary.saveToLibrary(localUrl, album ?? '', (response) =>
        resolve(response)
      );
    });
  },
};
