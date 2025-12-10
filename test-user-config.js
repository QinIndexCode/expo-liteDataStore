// 测试用户配置加载功能
const fs = require('fs');
const path = require('path');

// 创建测试目录
const testDir = path.join(__dirname, 'test-user-config');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

// 创建模拟用户配置文件
const userConfigContent = `/**
 * 测试用户配置
 */
const config = {
  chunkSize: 10 * 1024 * 1024, // 修改为10MB
  storageFolder: 'test-storage-folder', // 修改存储文件夹
  encryption: {
    keyIterations: 150_000, // 修改迭代次数
    hmacAlgorithm: 'SHA-256', // 修改为SHA-256
  },
  cache: {
    maxSize: 2000, // 修改缓存大小
  },
  performance: {
    enableQueryOptimization: false, // 禁用查询优化
  },
};

export default config;
`;

fs.writeFileSync(path.join(testDir, 'liteStore.config.ts'), userConfigContent);

// 创建测试脚本，验证配置加载
const testScript = `// 测试脚本，验证用户配置是否被正确加载
require('ts-node/register');

// 将当前目录添加到模块搜索路径
const path = require('path');
require('module').Module._initPaths();
require('module').Module.globalPaths.push(path.join(__dirname, '..', 'dist', 'js'));

// 尝试加载配置
const config = require('./node_modules/expo-lite-data-store/dist/js/liteStore.config').default;

console.log('\n=== 测试用户配置加载 ===');
console.log('配置来源:', config === require('./node_modules/expo-lite-data-store/dist/js/liteStore.config').default ? 'dist/js/liteStore.config.js' : '用户配置');
console.log('\n=== 配置值验证 ===');
console.log('chunkSize:', config.chunkSize, '预期: 10485760 (10MB)');
console.log('storageFolder:', config.storageFolder, '预期: test-storage-folder');
console.log('encryption.keyIterations:', config.encryption.keyIterations, '预期: 150000');
console.log('encryption.hmacAlgorithm:', config.encryption.hmacAlgorithm, '预期: SHA-256');
console.log('cache.maxSize:', config.cache.maxSize, '预期: 2000');
console.log('performance.enableQueryOptimization:', config.performance.enableQueryOptimization, '预期: false');

// 验证配置是否被正确合并
const hasUserConfig = 
  config.chunkSize === 10 * 1024 * 1024 &&
  config.storageFolder === 'test-storage-folder' &&
  config.encryption.keyIterations === 150_000 &&
  config.encryption.hmacAlgorithm === 'SHA-256' &&
  config.cache.maxSize === 2000 &&
  config.performance.enableQueryOptimization === false;

console.log('\n=== 测试结果 ===');
if (hasUserConfig) {
  console.log('✅ 用户配置已被正确加载和合并！');
} else {
  console.log('❌ 用户配置未被正确加载！');
}

console.log('\n=== 完整配置 ===');
console.log(JSON.stringify(config, null, 2));
`;

// 写入测试脚本
fs.writeFileSync(path.join(testDir, 'test.js'), testScript);

// 创建package.json，安装依赖
const packageJson = {
  name: 'test-user-config',
  version: '1.0.0',
  description: '测试用户配置加载',
  type: 'module',
  scripts: {
    test: 'node test.js',
  },
  dependencies: {
    'ts-node': '^10.9.2',
    typescript: '^5.5.3',
  },
};

fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));

// 复制dist目录到测试项目
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  fs.cpSync(distDir, path.join(testDir, 'node_modules', 'expo-lite-data-store', 'dist'), { recursive: true });
}

// 复制package.json到测试项目
fs.cpSync(
  path.join(__dirname, 'package.json'),
  path.join(testDir, 'node_modules', 'expo-lite-data-store', 'package.json')
);

console.log('测试环境已创建:', testDir);
console.log('运行以下命令进行测试:');
console.log(`cd ${testDir} && npm install && node test.js`);
