export interface ULinkOptions {
  id: string;
  data?: any;
  selector?: string;
  timeout?: number;
  lazy?: boolean;
  useOpenInBrowerTips?: 'default' | ((...args: any[]) => void);
  proxyOpenDownload?: (defaultAction: () => void, linkInstance: ULinkInstance) => void;
  iosDeepLinksData?: any;
  androidDeepLinksData?: any;
}

export interface ULinkInstance {
  solution: Record<string, any>;
  opts: Record<string, any>;
}

/**
 * ULink
 */
export function startULink(links: ULinkOptions[]): void;

/**
 * 原始 ULink 对象（如果需要访问）
 */
export const ULink: any;

/**
 * 默认导出对象
 */
declare const _default: {
  ULink: typeof ULink;
  startULink: typeof startULink;
};

export default _default;
