// 测试配置文件生成功能
const fs = require('fs');
const path = require('path');

// 模拟用户项目目录
const testDir = path.join(__dirname, 'test-user-project');

// 清理测试目录
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}

// 创建测试目录
fs.mkdirSync(testDir, { recursive: true });

// 复制dist目录到测试项目
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  fs.cpSync(distDir, path.join(testDir, 'node_modules', 'expo-lite-data-store', 'dist'), { recursive: true });
}

// 复制package.json到测试项目
fs.cpSync(path.join(__dirname, 'package.json'), path.join(testDir, 'package.json'));

// 创建简单的测试脚本，模拟用户首次使用
const testScript = `// 测试脚本，模拟用户首次使用
const { createTable, insert, findOne } = require('./node_modules/expo-lite-data-store/dist/js/index');

async function test() {
  console.log('开始测试配置生成功能...');
  
  try {
    // 创建表，这将触发配置文件生成
    await createTable('test_table');
    console.log('✅ 成功创建表');
    
    // 插入数据
    await insert('test_table', { id: 1, name: 'test' });
    console.log('✅ 成功插入数据');
    
    // 查询数据
    const result = await findOne('test_table', { id: 1 });
    console.log('✅ 成功查询数据:', result);
    
    // 检查配置文件是否生成
    const configPath = path.join(__dirname, 'liteStore.config.ts');
    if (fs.existsSync(configPath)) {
      console.log('✅ 配置文件已生成:', configPath);
      const configContent = fs.readFileSync(configPath, 'utf8');
      console.log('配置文件内容预览:', configContent.substring(0, 200) + '...');
    } else {
      console.log('❌ 配置文件未生成');
    }
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

test();`;

// 写入测试脚本
fs.writeFileSync(path.join(testDir, 'test.js'), testScript);

console.log('测试项目已创建:', testDir);
console.log('运行以下命令进行测试:');
console.log(`cd ${testDir} && node test.js`);
