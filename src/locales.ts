export interface AppTranslations {
  sidebar: {
    title: string;
    genKey: string;
    ops: string;
    textOps: string;
    base64Ops: string;
    keysCount: string;
  };
  generator: {
    title: string;
    subtitle: string;
    keySizeLabel: string;
    keyNameLabel: string;
    keyDescLabel: string;
    generateBtn: string;
    generating: string;
    saveBtn: string;
    downloadPub: string;
    downloadPriv: string;
    copyPub: string;
    copyPriv: string;
    successGen: string;
    pubKeyLabel: string;
    privKeyLabel: string;
    savedKeysTitle: string;
    noSavedKeys: string;
  };
  operations: {
    title: string;
    subtitle: string;
    mode: string;
    encrypt: string;
    decrypt: string;
    selectKey: string;
    algorithm: string;
    uploadArea: string;
    uploadHint: string;
    processing: string;
    encryptBtn: string;
    decryptBtn: string;
    successFile: string;
    downloadBtn: string;
    noKeysError: string;
    selectKeyPlaceholder: string;
    hybridModeLabel: string;
    pureModeLabel: string;
    hybridModeDesc: string;
    pureModeDesc: string;
  };
  textOps: {
    title: string;
    subtitle: string;
    inputPlaceholder: string;
    outputPlaceholder: string;
    encryptBtn: string;
    decryptBtn: string;
    copied: string;
    copy: string;
    algoMode: string;
    hybridMode: string;
    pureMode: string;
    encryptionFlow: string;
    flowStandard: string;
    flowLicense: string;
    flowStandardDesc: string;
    flowLicenseDesc: string;
  };
  base64Ops: {
    title: string;
    subtitle: string;
    inputLabel: string;
    inputPlaceholder: string;
    encodeBtn: string;
    decodeBtn: string;
    resultLabel: string;
    emptyInputError: string;
    copied: string;
    copy: string;
    binaryConvert: string;
    binaryUploadLabel: string;
    binaryHint: string;
  };
  common: {
    error: string;
    success: string;
    close: string;
  };
}

export const translations: Record<'en' | 'zh', AppTranslations> = {
  en: {
    sidebar: {
      title: "RSACryptoManager",
      genKey: "Key Generation",
      ops: "File Encryption",
      textOps: "Content Encryption",
      base64Ops: "Base64 Parser",
      keysCount: "Saved Keys"
    },
    generator: {
      title: "RSA Key Pair Generator",
      subtitle: "Securely generate cryptographically robust RSA Public and Private key pairs entirely client-side.",
      keySizeLabel: "Key Size (bits)",
      keyNameLabel: "Key Identity Tag / Name",
      keyDescLabel: "Optional Description",
      generateBtn: "Generate RSA Key Pair",
      generating: "Generating Key Pair (Computing primes...)",
      saveBtn: "Save Key Pair",
      downloadPub: "Download Public Key",
      downloadPriv: "Download Private Key",
      copyPub: "Copy Public PEM",
      copyPriv: "Copy Private PEM",
      successGen: "RSA Key pair generated and saved locally!",
      pubKeyLabel: "Public Key (PEM Format)",
      privKeyLabel: "Private Key (PEM Format)",
      savedKeysTitle: "Identity Key Storage",
      noSavedKeys: "No keys generated or saved yet in this browser workspace."
    },
    operations: {
      title: "RSA File Crypter",
      subtitle: "Secure file encryption and decryption utilizing RSA keys, executed entirely in your local sandbox.",
      mode: "Operation Mode",
      encrypt: "Encrypt File",
      decrypt: "Decrypt File",
      selectKey: "Select Cryptographic Key",
      algorithm: "Encryption Strategy",
      uploadArea: "Click or Drag File Here to Process",
      uploadHint: "Supports files up to 25MB (images, archives, documents, databases, etc.)",
      processing: "Reticulating splines (Cryptographic execution)...",
      encryptBtn: "Encrypt File Bundle",
      decryptBtn: "Decrypt Encrypted File (.enc)",
      successFile: "Cryptographic operations succeeded!",
      downloadBtn: "Download Resulting File",
      noKeysError: "Generate or save a client key first!",
      selectKeyPlaceholder: "-- Choose a stored key from generation --",
      hybridModeLabel: "Hybrid Mode (AES-256 + RSA)",
      pureModeLabel: "Pure RSA Mode",
      hybridModeDesc: "Highly secure, supports unlimited file sizes by using highly optimized AES symmetric streaming.",
      pureModeDesc: "Direct asymmetrical encryption. Strictly limited load space (< 245 bytes). Perfect for quick licenses/signatures."
    },
    textOps: {
      title: "RSA Content Crypter",
      subtitle: "Perform advanced textual cryptographic encodings. Supports standard confidentiality and specialized enterprise licensing modes.",
      inputPlaceholder: "Enter plaintext or Base64 payload...",
      outputPlaceholder: "Cryptographic output is rendered here...",
      encryptBtn: "Encrypt Payload",
      decryptBtn: "Decrypt Ciphertext",
      copied: "Copied!",
      copy: "Copy Data",
      algoMode: "Symmetric Layer Option",
      hybridMode: "Hybrid Cipher Envelope (AES + RSA) - For long blocks",
      pureMode: "Pure RSA Cipher - Best for short payloads, license keys & tokens",
      encryptionFlow: "Cryptographic Flow Mode",
      flowStandard: "Standard Mode (Public Encrypt → Private Decrypt)",
      flowLicense: "Licensing Mode (Private Encrypt → Public Decrypt)",
      flowStandardDesc: "Best for confidentiality. Anyone with the public key can write private messages that only you can decrypt.",
      flowLicenseDesc: "Best for software licenses and authentic tokens. Only you can create valid license signatures using your private key. Customers verify integrity with your public key."
    },
    base64Ops: {
      title: "Interactive Base64 Parser",
      subtitle: "Fast raw Base64 translator. Convert strings natively without corrupted Unicode blocks, or encode files.",
      inputLabel: "Input String Content",
      inputPlaceholder: "Type or paste content (standard text or Base64 payload)...",
      encodeBtn: "String ➜ Base64",
      decodeBtn: "Base64 ➜ String",
      resultLabel: "Parser Result",
      emptyInputError: "Please write or paste something to parse.",
      copied: "Copied to Clipboard!",
      copy: "Copy Result",
      binaryConvert: "File to Base64 Encoder",
      binaryUploadLabel: "Select file to encode directly to Base64 data string",
      binaryHint: "Output includes optional Data URI prefix for immediate use in CSS/HTML"
    },
    common: {
      error: "Error",
      success: "Success",
      close: "Dismiss"
    }
  },
  zh: {
    sidebar: {
      title: "RSACryptoManager",
      genKey: "RSA 密钥生成",
      ops: "文件加密 / 解密",
      textOps: "内容加密 / 解密",
      base64Ops: "Base64 转换器",
      keysCount: "保存的密钥"
    },
    generator: {
      title: "RSA 密钥生成器",
      subtitle: "完全在浏览器本地安全、高速地运行，生成工业级高强度的 RSA 公钥与私钥对。",
      keySizeLabel: "密钥长度 (比特)",
      keyNameLabel: "密钥身份标识 / 别名",
      keyDescLabel: "描述（选填）",
      generateBtn: "开始生成 RSA 密钥",
      generating: "正在为您生成密钥 (深度检索大素数中...)",
      saveBtn: "保存至本地",
      downloadPub: "下载公钥",
      downloadPriv: "下载私钥",
      copyPub: "复制公钥 PEM",
      copyPriv: "复制私钥 PEM",
      successGen: "RSA 密钥对生成成功，已安全存储至本地浏览器空间！",
      pubKeyLabel: "公钥 (PEM 格式)",
      privKeyLabel: "私钥 (PEM 格式)",
      savedKeysTitle: "本地密钥管理库",
      noSavedKeys: "当前浏览器工作区尚未保存任何密钥，请先在上方执行生成。"
    },
    operations: {
      title: "RSA 文件加密箱",
      subtitle: "提供基于 RSA 密钥的文件加解密安全管理服务，全部操作在本地沙箱内执行。",
      mode: "操作类型",
      encrypt: "加密文件",
      decrypt: "解密文件",
      selectKey: "选择对应的 RSA 配对密钥",
      algorithm: "加解密策略",
      uploadArea: "点击此处或将目标文件拖拽至此",
      uploadHint: "完美支持 25MB 以内文件（照片、文档、压缩包、代码库、数据库等）",
      processing: "安全核能算法执行中...",
      encryptBtn: "执行文件打包加密",
      decryptBtn: "执行解密并还原 (.enc)",
      successFile: "文件加解密处理成功！",
      downloadBtn: "下载导出处理后的文件",
      noKeysError: "请先去生成并保存一对 RSA 密钥！",
      selectKeyPlaceholder: "-- 从下拉列表中选择一把密钥 --",
      hybridModeLabel: "混合加密模式 (AES-256 + RSA)",
      pureModeLabel: "纯非对称 RSA 模式",
      hybridModeDesc: "极其安全。使用 AES 对称流处理底层逻辑，任何大小的文件均可瞬间极速加解密。",
      pureModeDesc: "纯非对称映射。最大输入负载被系统严格限制在 245 字节以内，专为高安全轻量文件、密钥认证设计。"
    },
    textOps: {
      title: "RSA 字符内容加密",
      subtitle: "对任意文本串进行密码学变换，提供经典信息机密性模式，以及常用于商业序列号/授权许可 (License) 的签名模式。",
      inputPlaceholder: "在这里输入需要处理的文本或 Base64 密文串...",
      outputPlaceholder: "处理后的计算结果会在此渲染呈现...",
      encryptBtn: "执行加密内容",
      decryptBtn: "执行解密内容",
      copied: "成功复制到剪贴板！",
      copy: "复制结果数据",
      algoMode: "加密对称变换层",
      hybridMode: "AES-GCM 混合密码封包 - 适合超长多字符文本",
      pureMode: "纯 RSA 直接映射型密码 - 适合短文本/授权码/验证密匙",
      encryptionFlow: "加密流向模式",
      flowStandard: "标准保密模式 (公钥加密 ➜ 私钥解密)",
      flowLicense: "授权软件模式 (私钥加密 ➜ 公钥解密)",
      flowStandardDesc: "信息传递保障。任何人用公开的公钥进行加密，只有持有绝对私密私钥的您才能读出解密信息。",
      flowLicenseDesc: "授权防伪签名。只有你持有私钥可签发并加密合规文件（如 license.txt 授权），客户用公开的公钥解密校验，确属正版。"
    },
    base64Ops: {
      title: "Base64 精密解析器",
      subtitle: "支持 UTF-8 字符流与生僻字安全编解码的 Base64 转换器，杜绝中文乱码；同时支持文件极速转 Base64 编码。",
      inputLabel: "原始字符串输入",
      inputPlaceholder: "键入或粘贴您需要进行转换的数据字符串...",
      encodeBtn: "String ➜ Base64",
      decodeBtn: "Base64 ➜ String",
      resultLabel: "流转换计算结果",
      emptyInputError: "请输入要转换的文本字符串或密钥流。",
      copied: "结果已随手保存到您的剪贴板！",
      copy: "极速复制结果",
      binaryConvert: "文件一键转 Base64 编码器",
      binaryUploadLabel: "选择文件以将其全部内容实时转换为 Base64 编码文本",
      binaryHint: "渲染数据包含标准的 Data URI 前缀（如 data:image/png;base64...），支持在网页、代码中即插即用。"
    },
    common: {
      error: "发生异常",
      success: "执行成功",
      close: "关闭"
    }
  }
};
