import './style.css';
import {
	initNetworkExample,
	showAddNetworkModal,
	hideAddNetworkModal,
	saveNetwork,
	disconnectWallet,
	switchToFirstNetwork
} from './demo/network-example';

// 初始化示例
initNetworkExample();

// 添加网络按钮
const addNetworkBtn = document.querySelector('#add-network-btn') as HTMLButtonElement;
if (addNetworkBtn) {
	addNetworkBtn.addEventListener('click', () => {
		showAddNetworkModal();
	});
}

// 保存网络按钮
const saveNetworkBtn = document.querySelector('#save-network-btn') as HTMLButtonElement;
if (saveNetworkBtn) {
	saveNetworkBtn.addEventListener('click', () => {
		saveNetwork();
	});
}

// 取消添加网络按钮
const cancelAddNetworkBtn = document.querySelector('#cancel-add-network-btn') as HTMLButtonElement;
if (cancelAddNetworkBtn) {
	cancelAddNetworkBtn.addEventListener('click', () => {
		hideAddNetworkModal();
		// 重新启用 chainId 输入框
		(document.querySelector('#network-chain-id') as HTMLInputElement).disabled = false;
	});
}

// 点击背景关闭弹窗
const modal = document.querySelector('#add-network-modal') as HTMLDivElement;
if (modal) {
	modal.addEventListener('click', (e) => {
		if (e.target === modal) {
			hideAddNetworkModal();
			(document.querySelector('#network-chain-id') as HTMLInputElement).disabled = false;
		}
	});
}

// 断开连接按钮
const disconnectBtn = document.querySelector('#disconnect-wallet-btn') as HTMLButtonElement;
if (disconnectBtn) {
	disconnectBtn.addEventListener('click', () => {
		disconnectWallet();
	});
}

// 切换到第一个网络按钮
const switchBtn = document.querySelector('#switch-to-first-network-btn') as HTMLButtonElement;
if (switchBtn) {
	switchBtn.addEventListener('click', () => {
		switchToFirstNetwork();
	});
}
