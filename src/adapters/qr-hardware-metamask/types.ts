import type { ConnectorOptions } from '../../core/types/options.js';

/**
 * QR-based 硬件钱包连接器选项
 *
 * 用于通过 QR 码连接硬件钱包（如 AirGap Vault, Keystone 等）
 */
export interface QRHardwareConnectorOptions extends ConnectorOptions {
	/**
	 * 连接器的唯一标识符
	 */
	id: string;

	/**
	 * 连接器的显示名称
	 */
	name: string;

	/**
	 * 连接器图标
	 */
	icon?: string;

	/**
	 * QR 码生成配置
	 */
	qrConfig?: {
		/** QR 码尺寸（像素） */
		size?: number;
		/** 纠错级别 */
		errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
		/** 边距 */
		margin?: number;
	};

	/**
	 * 支持的派生路径
	 * @default ["m/44'/60'/0'/0/0"]
	 */
	derivationPaths?: string[];

	/**
	 * 默认派生路径
	 */
	defaultDerivationPath?: string;

	/**
	 * 账户分页配置
	 */
	pagination?: {
		/** 每页显示的账户数 */
		pageSize?: number;
		/** 初始页码 */
		initialPage?: number;
	};
}

/**
 * QR 扫描数据格式
 */
export interface QRScanData {
	/** 扫描类型 */
	type: 'sync' | 'sign' | 'account';
	/** 扫描的数据 */
	data: string;
	/** 额外的元数据 */
	metadata?: Record<string, unknown>;
}

/**
 * 账户信息（从硬件钱包获取）
 */
export interface HardwareAccount {
	/** 账户地址 */
	address: string;
	/** 派生路径 */
	derivationPath: string;
	/** 公钥 */
	publicKey?: string;
	/** 余额（可选） */
	balance?: string;
	/** 账户索引 */
	index: number;
}

/**
 * 扩展公钥信息（用于本地派生地址）
 */
export interface ExtendedPublicKey {
	/** 扩展公钥 (xpub) */
	xpub: string;
	/** Chain code */
	chainCode: string;
	/** 公钥 */
	publicKey: string;
	/** 父指纹 (parent fingerprint) */
	parentFingerprint?: string;
	/** 基础派生路径 (例如：m/44'/60'/0') */
	basePath: string;
	/** 深度 (depth in derivation path) */
	depth?: number;
}

/**
 * QR 连接器事件
 */
export interface QRConnectorEvents {
	/** QR 码生成完成 */
	qrGenerated: (qrData: string) => void;
	/** QR 码扫描完成 */
	qrScanned: (data: QRScanData) => void;
	/** 显示 QR 码 */
	displayQR: (qrData: string, type: 'sync' | 'sign') => void;
	/** 等待扫描 */
	waitingForScan: () => void;
	/** 扫描超时 */
	scanTimeout: () => void;
}

/**
 * QR 数据编码器
 */
export interface QREncoder {
	/** 编码同步请求 */
	encodeSync(chainId: number, derivationPath: string): string;
	/** 编码签名请求 */
	encodeSign(transaction: unknown): string;
	/** 编码 EIP-712 类型化数据签名请求 */
	encodeSignTypedData(typedData: unknown): string;
	/** 解码账户信息 */
	decodeAccounts(qrData: string): HardwareAccount[];
	/** 解码扩展公钥信息 */
	decodeExtendedPublicKey?(qrData: string): ExtendedPublicKey | null;
	/** 解码签名结果 */
	decodeSignature(qrData: string): string;
}
