type TargetObject = Record<string, any>;

const dirtify = (obj: TargetObject) => {
  // 為每個 dirtify 呼叫建立獨立的狀態
  let isDirtyForThisInstance: boolean = false;
  // 屬性鍵可以是 string 或 symbol，因此 dirtyFieldsForThisInstance 需要支援這兩種鍵類型
  const dirtyFieldsForThisInstance: Record<string | symbol, boolean> = {};

  const instanceHandler: ProxyHandler<TargetObject> = {
    get(target: TargetObject, property: string | symbol, receiver: any): any {
      if (property === 'isDirty') {
        return isDirtyForThisInstance;
      }
      if (property === 'dirtyFields') {
        return { ...dirtyFieldsForThisInstance }; // 返回副本以保護內部狀態
      }

      const value = Reflect.get(target, property, receiver); // property 可以是 string 或 symbol

      if (typeof value === 'object' && value !== null) {
        // 巢狀物件使用相同的 handler 實例 (instanceHandler)，
        // 以便共享閉包中的 isDirtyForThisInstance 和 dirtyFieldsForThisInstance
        return new Proxy(value, this); // 'this' 指向 instanceHandler
      }
      return value;
    },
    set(target: TargetObject, property: string | symbol, value: any, receiver: any): boolean {
      if (property === 'isDirty' || property === 'dirtyFields') {
        // 阻止直接設定這些特殊屬性
        // 返回 true 表示操作被接受（即使未作更改）
        return true;
      }

      const propertyExists = Reflect.has(target, property);
      const oldValue = Reflect.get(target, property, receiver); // 傳遞 receiver 以確保行為一致性

      if (!propertyExists || oldValue !== value) {
        // 僅當屬性是新的，或其值實際更改時才標記為 dirty
        isDirtyForThisInstance = true;
        dirtyFieldsForThisInstance[property] = true;
      }

      return Reflect.set(target, property, value, receiver);
    },
  };

  if (typeof obj !== 'object' || obj === null) {
    return obj; // 或拋出錯誤
  }

  return new Proxy(obj, instanceHandler);
};

export default dirtify;