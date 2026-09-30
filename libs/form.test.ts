import { formCheckbox, formHidden, formInput, formLegend, formMultiSelect, formSelect, formSubmit, formText } from './form';

const base = { name: 'email', label: 'Email', type: 'email', placeholder: 'you@x.com', wrapClass: 'col-6', required: true };

describe('libs/form', () => {
  describe('formInput', () => {
    it('renders label, required marker, name and id', () => {
      const html = formInput(base);
      expect(html).toContain('name="email"');
      expect(html).toContain('id="email"');
      expect(html).toContain('required');
      expect(html).toContain('<span class="text-danger">*</span>');
      expect(html).toContain('type="email"');
    });

    it('omits required marker and attribute when not required', () => {
      const html = formInput({ ...base, required: false });
      expect(html).not.toContain('text-danger');
      expect(html).not.toContain('required');
    });

    it('uses custom id/class/value/disabled', () => {
      const html = formInput({ ...base, id: 'custom-id', class: 'extra', value: 'v1', disabled: true });
      expect(html).toContain('id="custom-id"');
      expect(html).toContain('extra form-control');
      expect(html).toContain('value="v1"');
      expect(html).toContain('disabled');
    });
  });

  describe('formHidden', () => {
    it('renders a hidden input', () => {
      const html = formHidden({ name: 'token', value: 'abc', id: 'tok' });
      expect(html).toContain('type="hidden"');
      expect(html).toContain('value="abc"');
    });
  });

  describe('formSelect', () => {
    const opts = {
      name: 'country',
      label: 'Country',
      wrapClass: 'col-6',
      options: [
        { value: 'us', text: 'US' },
        { value: 'gb', text: 'GB' },
      ],
    };

    it('renders options and marks the selected one', () => {
      const html = formSelect({ ...opts, selected: 'gb' });
      expect(html).toContain('<option value="us" >US</option>');
      expect(html).toContain('<option value="gb" selected>GB</option>');
    });

    it('renders a firstOption placeholder when provided', () => {
      const html = formSelect({ ...opts, firstOption: 'Choose…' });
      expect(html).toContain('<option value="">Choose…</option>');
    });
  });

  describe('formMultiSelect', () => {
    it('renders a multi-select', () => {
      const html = formMultiSelect({
        name: 'tags',
        label: 'Tags',
        wrapClass: 'col',
        options: [{ value: 'a', text: 'A' }],
      });
      expect(html).toContain('multiple');
      expect(html).toContain('multiselect');
    });
  });

  describe('formText', () => {
    it('renders textarea with value content', () => {
      const html = formText({ name: 'bio', label: 'Bio', wrapClass: 'col', placeholder: 'p', value: 'hello' });
      expect(html).toContain('<textarea');
      expect(html).toContain('>hello</textarea>');
    });
  });

  describe('formCheckbox', () => {
    it('renders a checked switch', () => {
      const html = formCheckbox({ name: 'active', label: 'Active', wrapClass: 'col', checked: true });
      expect(html).toContain('type="checkbox"');
      expect(html).toContain('checked');
      expect(html).toContain('form-switch');
    });
  });

  describe('formSubmit', () => {
    it('renders cancel link and save button', () => {
      const html = formSubmit({ wrapClass: 'col', cancelUrl: '/back' });
      expect(html).toContain('href="/back"');
      expect(html).toContain('id="submit"');
    });
  });

  describe('formLegend', () => {
    it('renders a legend with the title', () => {
      expect(formLegend('Details')).toContain('Details');
    });
  });
});
