import { mount } from '@vue/test-utils';
import TimeRangePicker from '../time-range-picker';
import { nextTick } from 'vue';
import { vi } from 'vitest';

describe('TimeRangePicker', () => {
  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
  const originalScrollTo = Element.prototype.scrollTo;
  const originalGetComputedStyle = window.getComputedStyle;

  afterEach(() => {
    document.body.innerHTML = '';
  });
  beforeAll(() => {
    // 模拟getBoundingClientRect返回有效尺寸 否则点击input后popup会隐藏，不符合预期
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 100,
      height: 30,
      top: 0,
      left: 0,
      right: 100,
      bottom: 30,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
    // Mock getComputedStyle 返回期望的值
    window.getComputedStyle = vi.fn().mockImplementation((element) => {
      return {
        width: element.style.width || '100',
        height: element.style.height || '100',
        marginTop: element.style.marginTop || '0',
      };
    });
    // Mock scrollTo 方法，使其在调用时触发 scroll 事件
    Element.prototype.scrollTo = vi.fn(function (
      this: Element,
      optionsOrX?: ScrollToOptions | number,
      y?: number,
    ): void {
      // 设置滚动位置
      if (typeof optionsOrX === 'object' && optionsOrX !== null) {
        // ScrollToOptions 重载
        this.scrollTop = optionsOrX.top || 0;
        this.scrollLeft = optionsOrX.left || 0;
      } else {
        // x, y number 重载
        this.scrollLeft = (optionsOrX as number) || 0;
        this.scrollTop = y || 0;
      }
      // 触发 scroll 事件
      this.dispatchEvent(new Event('scroll'));
    }) as Element['scrollTo'];
  });
  afterAll(() => {
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    Element.prototype.scrollTo = originalScrollTo;
    window.getComputedStyle = originalGetComputedStyle;
  });

  it('base render', () => {
    const wrapper = mount(TimeRangePicker);
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.find('.t-time-range-picker').exists()).toBeTruthy();
  });

  it('placeholder works fine', () => {
    const placeholder = ['开始时间', '结束时间'];
    const wrapper = mount(TimeRangePicker, {
      props: { placeholder },
    });
    const inputs = wrapper.findAll('input');
    expect(inputs[0].attributes('placeholder')).toBe(placeholder[0]);
    expect(inputs[1].attributes('placeholder')).toBe(placeholder[1]);
  });

  it('disabled works fine', () => {
    const wrapper = mount(TimeRangePicker, {
      props: { disabled: true },
    });
    expect(wrapper.find('.t-is-disabled').exists()).toBeTruthy();
  });

  it('readonly works fine', () => {
    const wrapper = mount(TimeRangePicker, {
      props: { readonly: true },
    });
    const inputs = wrapper.findAll('input');
    expect(inputs[0].attributes('readonly')).toBe('');
    expect(inputs[1].attributes('readonly')).toBe('');
  });

  it('allowInput works fine', () => {
    const wrapper = mount(TimeRangePicker, {
      props: { allowInput: true },
    });
    const inputs = wrapper.findAll('input');
    expect(inputs[0].attributes('readonly')).toBe(undefined);
    expect(inputs[1].attributes('readonly')).toBe(undefined);
  });

  it('onFocus works fine', async () => {
    const onFocus = vi.fn();
    const wrapper = mount(TimeRangePicker, {
      props: { onFocus },
    });
    await wrapper.find('input').trigger('focus');
    expect(onFocus).toHaveBeenCalled();
  });

  it('onBlur works fine', async () => {
    const onBlur = vi.fn();
    const wrapper = mount(TimeRangePicker, {
      props: { onBlur },
    });
    await wrapper.find('input').trigger('blur');
    expect(onBlur).toHaveBeenCalled();
  });

  it('onInput works fine', async () => {
    const onInput = vi.fn();
    const wrapper = mount(TimeRangePicker, {
      props: { onInput },
    });
    await wrapper.find('input').setValue('10:00:00');
    expect(onInput).toHaveBeenCalled();
  });

  it('onChange works fine', async () => {
    const onChange = vi.fn();
    const wrapper = mount(TimeRangePicker, {
      props: { onChange },
    });
    wrapper.vm.$emit('change', ['10:00:00', '12:00:00']);
    expect(onChange).toHaveBeenCalled();
  });

  // 专门覆盖handleClear函数的测试
  it('handleClear works fine', async () => {
    const onChange = vi.fn();
    const wrapper = mount(TimeRangePicker, {
      props: {
        modelValue: ['10:00:00', '18:00:00'],
        clearable: true,
        onChange,
      },
    });

    // 等待组件渲染完成
    await nextTick();

    // 悬停到范围输入框上显示清空按钮
    const rangeInput = wrapper.find('.t-range-input');
    await rangeInput.trigger('mouseenter');
    await nextTick();

    // 查找清空按钮并点击（使用正确的类名）
    const clearButton = wrapper.find('.t-range-input__suffix-clear');
    expect(clearButton.exists()).toBeTruthy();

    // 模拟点击清空按钮，这会触发handleClear函数
    await clearButton.trigger('click');

    // 验证onChange被调用，传入null值（清空）
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('panel display and confirm button works fine when click first input', async () => {
    const wrapper = mount(TimeRangePicker, {
      attachTo: document.body,
    });
    // 等待组件渲染完成
    await nextTick();
    // 点击输入框显示面板

    const firstInput = wrapper.findAll('input');
    await firstInput[0].trigger('click');

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(document.querySelector('.t-popup').style.display).toBe('');
    const timeItems = document.querySelectorAll('.t-time-picker__panel-body-scroll-item');
    timeItems[3].dispatchEvent(new Event('click'));
    await new Promise((resolve) => setTimeout(resolve, 100));

    const footer = document.querySelector('.t-time-picker__panel-section-footer');
    footer.children[0].dispatchEvent(new Event('click'));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(document.querySelector('.t-popup').style.display).toBe('none');
  });
  it('panel display and confirm button works fine when click second input', async () => {
    const wrapper = mount(TimeRangePicker, {
      attachTo: document.body,
    });
    // 等待组件渲染完成
    await nextTick();
    // 点击输入框显示面板

    const firstInput = wrapper.findAll('input');
    await firstInput[1].trigger('click');

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(document.querySelector('.t-popup').style.display).toBe('');
    const timeItems = document.querySelectorAll('.t-time-picker__panel-body-scroll-item');
    timeItems[3].dispatchEvent(new Event('click'));
    await new Promise((resolve) => setTimeout(resolve, 100));

    const footer = document.querySelector('.t-time-picker__panel-section-footer');
    footer.children[0].dispatchEvent(new Event('click'));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(document.querySelector('.t-popup').style.display).toBe('none');
  });
  it('panel input and blur works fine', async () => {
    const onBlur = vi.fn();
    const onInput = vi.fn();
    const wrapper = mount(TimeRangePicker, {
      props: {
        allowInput: true,
        onBlur,
        onInput,
      },
      attachTo: document.body,
    });
    // 等待组件渲染完成
    await nextTick();
    // 点击输入框显示面板

    const firstInput = wrapper.find('input');
    await firstInput.trigger('click');
    firstInput.setValue('10:00:00');
    expect(onInput).toHaveBeenCalled();
    await firstInput.trigger('blur');
    expect(onBlur).toHaveBeenCalled();
  });
  it('panel preset works fine when click separator', async () => {
    const onChange = vi.fn();
    const wrapper = mount(TimeRangePicker, {
      props: {
        presets: {
          下午: ['18:00:00', '12:00:00'],
        },
        onChange,
      },
      attachTo: document.body, // ✅ 添加这一行
    });
    await nextTick();
    const separator = wrapper.find('.t-range-input__inner-separator');
    await separator.trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect((document.querySelector('.t-popup') as HTMLElement)?.style.display).toBe('');
    const footer = document.querySelector('.t-time-picker__panel-section-footer');
    footer.children[1].dispatchEvent(new Event('click'));
    footer.children[0].dispatchEvent(new Event('click'));
    expect(onChange).toHaveBeenCalledWith(['12:00:00', '18:00:00']);
  });
  it('panel preset works not fine when presets is not a array', async () => {
    const onChange = vi.fn();
    const wrapper = mount(TimeRangePicker, {
      props: {
        presets: {
          下午: 123,
        },
        onChange,
      },
      attachTo: document.body, // ✅ 添加这一行
    });
    await nextTick();
    const firstInput = wrapper.findAll('input');
    await firstInput[0].trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect((document.querySelector('.t-popup') as HTMLElement)?.style.display).toBe('');
    const footer = document.querySelector('.t-time-picker__panel-section-footer');
    footer.children[1].dispatchEvent(new Event('click'));
    expect(onChange).not.toHaveBeenCalled();
  });
  it('panel preset works fine when click input', async () => {
    const onChange = vi.fn();
    const wrapper = mount(TimeRangePicker, {
      props: {
        presets: {
          下午: ['12:00:00', '18:00:00'],
        },
        onChange,
      },
      attachTo: document.body, // ✅ 添加这一行
    });
    await nextTick();
    const firstInput = wrapper.findAll('input');
    await firstInput[0].trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect((document.querySelector('.t-popup') as HTMLElement)?.style.display).toBe('');
    const footer = document.querySelector('.t-time-picker__panel-section-footer');
    footer.children[1].dispatchEvent(new Event('click'));
    footer.children[0].dispatchEvent(new Event('click'));
    expect(onChange).toHaveBeenCalledWith(['12:00:00', '12:00:00']);
  });
});
