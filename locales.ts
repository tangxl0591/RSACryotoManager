import { Language } from './types';

export const translations: Record<Language, any> = {
  en: {
    sidebar: {
      title: "RSA Manager",
      genKey: "Key Generation",
      ops: "Encryption Ops",
      build: "Electron Ready Build"
    },
    generator: {
      title: "Generate RSA Key Pair",
      subtitle: "Create robust 2048-bit or 4096-bit RSA keys.",
      saveLocally: "Keys are saved locally alongside the application.",
      saveBrowser: "Keys are saved to browser storage.",
      labelName: "Key Name (Folder Name)",
      placeholderName: "e.g. secure-comm-2024",
      labelSpec: "Key Size",
      labelAlgo: "Default Encryption Algorithm",
      stdSecurity: "2048-bit (Standard)",
      highSecurity: "4096-bit (High Security)",
      btnGenerate: "Generate & Save",
      btnGenerating: "Generating...",
      successTitle: "Keys Created Successfully",
      openFolder: "Open Folder",
      download: "Download Again",
      savedTo: "Saved to:",
      errorName: "Key name is required"
    },
    operations: {
      title: "Crypto Operations",
      subtitle: "Encrypt or decrypt files using AES (Hybrid) with your RSA keys.",
      mode: "Operation Mode",
      encrypt: "Encrypt",
      decrypt: "Decrypt",
      selectKey: "Select Key Pair",
      chooseKey: "-- Choose Key --",
      noKeys: "No keys found. Generate a key first.",
      clickSelect: "Click to select a file",
      anyType: "Any file type supported",
      change: "Change",
      encryptBtn: "Encrypt File",
      decryptBtn: "Decrypt File",
      processing: "Processing...",
      selectKeyPrompt: "Please select a key pair to proceed.",
      success: "Success!",
      output: "Output:",
      download: "Download File",
      base64Output: "Base64 Output",
      decryptedContent: "Decrypted Content",
      copy: "Copy",
      copied: "Copied",
      usingAlgo: "Using:"
    }
  },
  zh: {
    sidebar: {
      title: "RSA 密钥管理",
      genKey: "密钥生成",
      ops: "加解密操作",
      build: "Electron 版本"
    },
    generator: {
      title: "生成 RSA 密钥对",
      subtitle: "创建高强度的 2048 位或 4096 位 RSA 密钥。",
      saveLocally: "密钥将保存在应用程序的本地目录中。",
      saveBrowser: "密钥将保存在浏览器缓存中。",
      labelName: "密钥名称 (文件夹名)",
      placeholderName: "例如：secure-comm-2024",
      labelSpec: "密钥长度",
      labelAlgo: "默认加密算法",
      stdSecurity: "2048 位 (标准)",
      highSecurity: "4096 位 (高强度)",
      btnGenerate: "生成并保存",
      btnGenerating: "正在生成...",
      successTitle: "密钥创建成功",
      openFolder: "打开文件夹",
      download: "重新下载",
      savedTo: "保存路径：",
      errorName: "请输入密钥名称"
    },
    operations: {
      title: "加解密操作",
      subtitle: "使用 RSA 密钥进行 AES (混合加密) 文件加解密。",
      mode: "操作模式",
      encrypt: "加密",
      decrypt: "解密",
      selectKey: "选择密钥对",
      chooseKey: "-- 请选择密钥 --",
      noKeys: "未找到密钥，请先生成。",
      clickSelect: "点击选择文件",
      anyType: "支持任意文件类型",
      change: "更改文件",
      encryptBtn: "加密文件",
      decryptBtn: "解密文件",
      processing: "处理中...",
      selectKeyPrompt: "请先选择一个密钥对。",
      success: "操作成功！",
      output: "输出文件：",
      download: "下载文件",
      base64Output: "Base64 输出",
      decryptedContent: "解密内容预览",
      copy: "复制",
      copied: "已复制",
      usingAlgo: "算法："
    }
  }
};