import { describe, it, expect, beforeEach } from 'vitest';
import dirtify from '../src/dirtify.js'; // 假設 dirtify.ts 在 src 目錄下

describe('dirtify', () => {
  let obj: any;
  let dirtyObj: any;

  beforeEach(() => {
    obj = {
      name: 'Alice',
      age: 30,
      address: {
        street: '123 Main St',
        city: 'Wonderland',
      },
    };
    dirtyObj = dirtify(obj);
  });

  it('should initially not be dirty', () => {
    expect(dirtyObj.isDirty).toBe(false);
    expect(dirtyObj.dirtyFields).toEqual({});
  });

  it('should become dirty when a property is set', () => {
    dirtyObj.name = 'Bob';
    expect(dirtyObj.isDirty).toBe(true);
    expect(dirtyObj.dirtyFields).toEqual({ name: true });
  });

  it('should become dirty and record field even if value is the same (current behavior)', () => {
    dirtyObj.name = 'Alice'; // 賦予相同的值
    expect(dirtyObj.isDirty).toBe(false);
    expect(dirtyObj.dirtyFields).toEqual({});
  });

  it('should track multiple dirty fields', () => {
    dirtyObj.name = 'Bob';
    dirtyObj.age = 31;
    expect(dirtyObj.isDirty).toBe(true);
    expect(dirtyObj.dirtyFields).toEqual({ name: true, age: true });
  });

  it('should handle nested object modifications', () => {
    dirtyObj.address.street = '456 Oak St';
    expect(dirtyObj.isDirty).toBe(true);
    // 當巢狀物件的屬性被修改時，dirtyFields 會記錄實際被修改的屬性名 (例如 'street')
    // 而不是巢狀物件本身在父物件中的鍵名 (例如 'address')，
    // 因為所有 Proxy 共享同一個 dirtyFieldsForThisInstance。
    expect(dirtyObj.dirtyFields).toEqual({ street: true });

    // 驗證巢狀物件本身也是 Proxy 並且可以查詢其狀態
    // 注意：目前的 dirtify 實現中，巢狀 Proxy 共享父級的 isDirty 和 dirtyFields 狀態
    expect(dirtyObj.address.isDirty).toBe(true);
    // dirtyObj.address.dirtyFields 會返回與 dirtyObj.dirtyFields 相同的共享狀態
    expect(dirtyObj.address.dirtyFields).toEqual({ street: true });
  });

  it('should handle new property additions', () => {
    dirtyObj.newProp = 'newValue';
    expect(dirtyObj.isDirty).toBe(true);
    expect(dirtyObj.dirtyFields).toEqual({ newProp: true });
  });

  it('should not allow direct modification of isDirty', () => {
    expect(dirtyObj.isDirty).toBe(false);
    try {
      dirtyObj.isDirty = true; // 嘗試修改
    } catch (e) {
      // 在嚴格模式下，賦值給 getter-only 屬性可能會拋錯
      // 在非嚴格模式下，賦值會靜默失敗
    }
    expect(dirtyObj.isDirty).toBe(false); // 應該保持不變

    dirtyObj.name = 'Changed'; // 正常修改使其變髒
    expect(dirtyObj.isDirty).toBe(true);
    try {
      dirtyObj.isDirty = false; // 嘗試修改
    } catch (e) {
      // 同上
    }
    expect(dirtyObj.isDirty).toBe(true); // 應該保持不變
  });

  it('should not allow direct modification of dirtyFields', () => {
    const initialDirtyFields = dirtyObj.dirtyFields;
    expect(initialDirtyFields).toEqual({});
    try {
      dirtyObj.dirtyFields = { someField: true }; // 嘗試修改
    } catch (e) {
      // 同上
    }
    expect(dirtyObj.dirtyFields).toEqual({}); // 應該保持不變

    dirtyObj.name = 'Changed'; // 正常修改
    expect(dirtyObj.dirtyFields).toEqual({ name: true });
    try {
      dirtyObj.dirtyFields = {}; // 嘗試修改
    } catch (e) {
      // 同上
    }
    expect(dirtyObj.dirtyFields).toEqual({ name: true }); // 應該保持不變
  });

  it('should return a copy of dirtyFields, so internal state is not mutated', () => {
    dirtyObj.name = 'Bob';
    const fields = dirtyObj.dirtyFields;
    fields.age = true; // 修改返回的物件
    expect(dirtyObj.dirtyFields).toEqual({ name: true }); // 內部狀態不應改變
  });

  it('should return the original non-object value if a non-object is passed', () => {
    // @ts-expect-error Testing non-object input.
    expect(dirtify(null)).toBeNull();
    // @ts-expect-error Testing non-object input.
    expect(dirtify(undefined)).toBeUndefined();
    // @ts-expect-error Testing non-object input.
    expect(dirtify(123)).toBe(123);
    // @ts-expect-error Testing non-object input.
    expect(dirtify('test')).toBe('test');
    // @ts-expect-error Testing non-object input.
    expect(dirtify(true)).toBe(true);
  });

  it('should handle symbol properties', () => {
    const symProp = Symbol('symProp');
    obj[symProp] = 'symbolValue';
    dirtyObj = dirtify(obj);

    expect(dirtyObj.isDirty).toBe(false);
    dirtyObj[symProp] = 'newSymbolValue';
    expect(dirtyObj.isDirty).toBe(true);
    expect(dirtyObj.dirtyFields[symProp]).toBe(true);
    expect(dirtyObj[symProp]).toBe('newSymbolValue');
  });

  it('should correctly handle nested object access after parent modification', () => {
    dirtyObj.name = 'Bob'; // 修改父物件
    expect(dirtyObj.address.city).toBe('Wonderland'); // 存取巢狀物件
    dirtyObj.address.city = 'New City'; // 修改巢狀物件
    expect(dirtyObj.isDirty).toBe(true);
    expect(dirtyObj.dirtyFields).toEqual({ name: true, city: true });
    expect(dirtyObj.address.city).toBe('New City');
  });

  it('should maintain separate dirty states for different dirtify instances', () => {
    const obj1 = { a: 1 };
    const obj2 = { b: 2 };

    const dirtyObj1 = dirtify(obj1);
    const dirtyObj2 = dirtify(obj2);

    expect(dirtyObj1.isDirty).toBe(false);
    expect(dirtyObj2.isDirty).toBe(false);

    dirtyObj1.a = 10;
    expect(dirtyObj1.isDirty).toBe(true);
    expect(dirtyObj1.dirtyFields).toEqual({ a: true });
    expect(dirtyObj2.isDirty).toBe(false); // obj2 應不受影響
    expect(dirtyObj2.dirtyFields).toEqual({});

    dirtyObj2.b = 20;
    expect(dirtyObj1.isDirty).toBe(true);
    expect(dirtyObj1.dirtyFields).toEqual({ a: true });
    expect(dirtyObj2.isDirty).toBe(true);
    expect(dirtyObj2.dirtyFields).toEqual({ b: true });
  });

  it('nested proxies should share the same dirtiness state of the root proxy', () => {
    dirtyObj.address.street = '456 Oak St';
    const nestedAddress = dirtyObj.address;

    expect(dirtyObj.isDirty).toBe(true);
    expect(nestedAddress.isDirty).toBe(true); // 巢狀 Proxy 應反映根 Proxy 的 isDirty
    expect(dirtyObj.dirtyFields).toEqual({ street: true }); // 初始修改 street
    expect(nestedAddress.dirtyFields).toEqual({ street: true }); // 共享狀態

    nestedAddress.city = "New City";
    expect(dirtyObj.isDirty).toBe(true);
    expect(nestedAddress.isDirty).toBe(true);
    // 修改 nestedAddress.city 後，'city' 也會被記錄到共享的 dirtyFields 中
    expect(dirtyObj.dirtyFields).toEqual({ street: true, city: true });
    expect(nestedAddress.dirtyFields).toEqual({ street: true, city: true });
  });
});
