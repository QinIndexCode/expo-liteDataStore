import { StorageError } from "../types/storageErrorInfc";
import config from "../liteStore.config";

export default function withTimeout<T>(
    promise: Promise<T>,
    ms = config.timeout,
    operation = "chunked file operation"
): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) => {
            setTimeout(
                () =>
                    reject(new StorageError(`${operation} timeout`, "TIMEOUT")),
                ms
            );
        }),
    ]);
}