type FormInputOpts = {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  wrapClass: string;
  required: boolean;
  value?: string;
  disabled?: boolean;
  class?: string;
  id?: string;
  style?: string;
};

export const formInput = (options: FormInputOpts) => {
  return `
    <div class="${options.wrapClass}">
      <label class="form-label">${options.label} ${options.required ? '<span class="text-danger">*</span>' : ''}</label>
      <input class="${options.class ? `${options.class} form-control` : 'form-control'}" type="${options.type}" name="${options.name}" id="${options.id || options.name}" placeholder="${options.placeholder}" ${options.required ? 'required' : ''} ${options.value ? `value="${options.value}"` : ''} ${options.disabled ? 'disabled' : ''}>
    </div>
  `;
};

type FormHiddenOpts = Pick<FormInputOpts, 'name' | 'value'> & { id: string };

export const formHidden = (options: FormHiddenOpts) => {
  return `
    <input type="hidden" name="${options.name}" id="${options.id}" ${options.value ? `value="${options.value}"` : ''}>
  `;
};

type FormSelectOpts = {
  name: string;
  label: string;
  wrapClass: string;
  firstOption?: string;
  options: { value: string; text: string }[];
  required?: boolean;
  selected?: string;
  disabled?: boolean;
  class?: string;
  style?: string;
  id?: string;
};

export const formSelect = (options: FormSelectOpts) => {
  return `
    <div class="${options.wrapClass}">
      ${options.label ? `<label class="form-label">${options.label} ${options.required ? '<span class="text-danger">*</span>' : ''}</label>` : ''}
      <select class="${options.class ? `form-select ${options.class}` : 'form-select'}" name="${options.name}" id="${options.id || options.name}" ${options.required ? 'required' : ''} ${options.disabled ? 'disabled' : ''} ${options.style ? `style="${options.style}"` : ''}>
        ${options.firstOption ? `<option value="">${options.firstOption}</option>` : ''}
        ${options.options.map(option => `<option value="${option.value}" ${options.selected === option.value ? 'selected' : ''}>${option.text}</option>`).join('')}
      </select>
    </div>
  `;
};

type FormMultiSelectOpts = Pick<
  FormSelectOpts,
  'name' | 'label' | 'wrapClass' | 'options' | 'required' | 'disabled' | 'class' | 'selected' | 'style'
> & { id?: string };

export const formMultiSelect = (options: FormMultiSelectOpts) => {
  return `
    <div class="${options.wrapClass}">
      <label class="form-label">${options.label} ${options.required ? '<span class="text-danger">*</span>' : ''}</label>
      <select class="${options.class ? `multiselect form-select ${options.class}` : 'multiselect form-select'}" name="${options.name}" id="${options.id || options.name}" ${options.required ? 'required' : ''} ${options.disabled ? 'disabled' : ''} ${options.style ? `style="${options.style}"` : ''} multiple>
        ${options.options.map(option => `<option value="${option.value}" ${options.selected === option.value ? 'selected' : ''}>${option.text}</option>`).join('')}
      </select>
    </div>
  `;
};

type FormTextOpts = {
  name: string;
  label: string;
  wrapClass: string;
  placeholder: string;
  required?: boolean;
  value?: string;
  disabled?: boolean;
  class?: string;
  id?: string;
  style?: string;
};

export const formText = (options: FormTextOpts) => {
  return `
    <div class="${options.wrapClass}">
      <label class="form-label">${options.label} ${options.required ? '<span class="text-danger">*</span>' : ''}</label>
      <textarea class="${options.class ? `${options.class} form-control` : 'form-control'}" name="${options.name}" id="${options.id || options.name}" placeholder="${options.placeholder}" ${options.required ? 'required' : ''} ${options.disabled ? 'disabled' : ''} ${options.style ? `style="${options.style}"` : ''}>${options.value ? options.value : ''}</textarea>
    </div>
  `;
};

type FormCheckboxOpts = {
  name: string;
  label: string;
  wrapClass: string;
  required?: boolean;
  checked?: boolean;
  disabled?: boolean;
  class?: string;
  id?: string;
  style?: string;
};

export const formCheckbox = (options: FormCheckboxOpts) => {
  return `
    <div class="${options.wrapClass}">
      <label class="form-label m-0" for="${options.id || options.name}">${options.label}</label>
      <div class="form-check form-switch">
        <input class="${options.class ? `${options.class} form-check-input` : 'form-check-input'}" name="${options.name}" id ="${options.name}" type="checkbox" 
        ${options.required ? 'required' : ''} ${options.checked ? 'checked' : ''} ${options.disabled ? 'disabled' : ''} ${options.style ? `style="${options.style}"` : ''}>
      </div>
    </div>
  `;
};

type FormSubmitOpts = {
  wrapClass: string;
  cancelUrl: string;
  id?: string;
  style?: string;
};

export const formSubmit = (options: FormSubmitOpts) => {
  return `
    <div class="${options.wrapClass}">
      <div class="d-grid d-sm-flex justify-content-sm-end gap-3">
        <a href="${options.cancelUrl}" class="btn btn-white d-block">Cancel</a>
        <button class="btn btn-secondary" name="submit" id="${options.id || 'submit'}" ${options.style ? `style="${options.style}"` : ''}>Save</button>
      </div>
    </div>
  `;
};

export const formLegend = (title: string) => {
  return `
    <div class="col-md-12 mt-4">
      <legend class="px-0 text-capitalize">${title}</legend>
    </div>
  `;
};
