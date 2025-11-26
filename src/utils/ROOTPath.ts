import { Directory, Paths } from "expo-file-system";
import config from "../liteStore.config";

// make sure create Singleton 
class SingletonRootPath {
    private static instance: Directory | null = null;

    private constructor() {}

    public static getInstance(): Directory {
        if (!SingletonRootPath.instance) {
            const rootDir = new Directory(Paths.document, config.storageFolder);
            rootDir.create({ intermediates: true });
            SingletonRootPath.instance = rootDir;
        }
        return SingletonRootPath.instance;
    }
}

const ROOT = SingletonRootPath.getInstance();

export default ROOT;
