import './style.css';
import {
	initManagerExample,
	setupManagerDisconnect,
	setupManagerSwitchChain,
	setupManagerSwitchAccount,
	setupManagerClearStorage
} from './demo/manager-example';

// 初始化连接管理器示例
initManagerExample();

// 设置断开连接按钮
const disconnectBtn = document.querySelector('#manager-disconnect') as HTMLButtonElement;
if (disconnectBtn) {
	setupManagerDisconnect(disconnectBtn);
}

// 设置切换网络按钮 - Polygon (137)
const switchToPolygonBtn = document.querySelector(
	'#manager-switch-chain-polygon'
) as HTMLButtonElement;
if (switchToPolygonBtn) {
	setupManagerSwitchChain(switchToPolygonBtn, 137);
}

// 设置切换网络按钮 - Base (8453)
const switchToBaseBtn = document.querySelector('#manager-switch-chain-base') as HTMLButtonElement;
if (switchToBaseBtn) {
	setupManagerSwitchChain(switchToBaseBtn, 8453);
}

// 设置切换账户按钮
const switchAccountBtn = document.querySelector('#manager-switch-account') as HTMLButtonElement;
if (switchAccountBtn) {
	setupManagerSwitchAccount(switchAccountBtn);
}

// 设置清除存储按钮
const clearStorageBtn = document.querySelector('#manager-clear-storage') as HTMLButtonElement;
if (clearStorageBtn) {
	setupManagerClearStorage(clearStorageBtn);
}

// 设置 QR Code Modal 关闭按钮
const qrCloseBtn = document.querySelector('#qr-close') as HTMLButtonElement;
const qrModal = document.querySelector('#qr-modal') as HTMLDivElement;
if (qrCloseBtn && qrModal) {
	qrCloseBtn.addEventListener('click', () => {
		qrModal.classList.remove('show');
	});

	// 点击背景也可以关闭
	qrModal.addEventListener('click', (e) => {
		if (e.target === qrModal) {
			qrModal.classList.remove('show');
		}
	});
}
