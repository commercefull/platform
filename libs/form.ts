type FormInputOpts = {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  wrapClass: string;
  required: boolean;
  value?: string;
  disabled?: boolean;
}

export const formInput = (options: FormInputOpts) => {
  return `
    <div class="${options.wrapClass}">
      <label class="form-label">${options.label} ${options.required ? '<span class="text-danger">*</span>' : ''}</label>
      <input class="form-control" type="${options.type}" name="${options.name}" id="${options.name}" placeholder="${options.placeholder}" ${options.required ? 'required' : ''} ${options.value ? `value="${options.value}"` : ''} ${options.disabled ? 'disabled' : ''}>
    </div>
  `
}

type FormSelectOpts = {
  name: string;
  label: string;
  wrapClass: string;
  options: { value: string, text: string }[];
  required?: boolean;
  selected?: string;
  disabled?: boolean;
}

export const formSelect = (options: FormSelectOpts) => {
  return `
    <div class="${options.wrapClass}">
      <label class="form-label">${options.label} ${options.required ? '<span class="text-danger">*</span>' : ''}</label>
      <select class="form-select" name="${options.name}" id="${options.name}" ${options.required ? 'required' : ''} ${options.disabled ? 'disabled' : ''}>
        ${options.options.map(option => `<option value="${option.value}" ${options.selected === option.value ? 'selected' : ''}>${option.text}</option>`).join('')}
      </select>
    </div>
  `
}

type FormMultiSelectOpts = FormSelectOpts;

export const formMultiSelect = (options: FormMultiSelectOpts) => {
  return `
    <div class="${options.wrapClass}">
      <label class="form-label">${options.label} ${options.required ? '<span class="text-danger">*</span>' : ''}</label>
      <select class="form-select" name="${options.name}" id="${options.name}" ${options.required ? 'required' : ''} ${options.disabled ? 'disabled' : ''} multiple>
        ${options.options.map(option => `<option value="${option.value}" ${options.selected === option.value ? 'selected' : ''}>${option.text}</option>`).join('')}
      </select>
    </div>
  `
}

type FormTextOpts = {
  name: string;
  label: string;
  wrapClass: string;
  placeholder: string;
  required?: boolean;
  value?: string;
  disabled?: boolean;
}

export const formText = (options: FormTextOpts) => {
  return `
    <div class="${options.wrapClass}">
      <label class="form-label">${options.label} ${options.required ? '<span class="text-danger">*</span>' : ''}</label>
      <textarea class="form-control" name="${options.name}" id="${options.name}" placeholder="${options.placeholder}" ${options.required ? 'required' : ''} ${options.disabled ? 'disabled' : ''}>${options.value ? options.value : ''}</textarea>
    </div>
  `
}

type FormCheckboxOpts = {
  name: string;
  label: string;
  wrapClass: string;
  required?: boolean;
  checked?: boolean;
  disabled?: boolean;
}

export const formCheckbox = (options: FormCheckboxOpts) => {
  return `
    <div class="${options.wrapClass}">
      <label class="form-label m-0" for="${options.name}">${options.label}</label>
      <div class="form-check form-switch">
        <input class="form-check-input" name="${options.name}" id ="${options.name}" type="checkbox" 
        ${options.required ? 'required' : ''} ${options.checked ? 'checked' : ''} ${options.disabled ? 'disabled' : ''}>
      </div>
    </div>
  `
}

type FormSubmitOpts = {
  wrapClass: string;
  cancelUrl: string;
}

export const formSubmit = (options: FormSubmitOpts) => {
  return `
    <div class="${options.wrapClass}">
      <div class="d-grid d-sm-flex justify-content-sm-end gap-3">
        <a href="${options.cancelUrl}" class="btn btn-white d-block">Cancel</a>
        <button class="btn btn-secondary" name="submit">Save</button>
      </div>
    </div>
  `
}

export const formLegend = (title: string) => {
  return `
    <div class="col-md-12 mt-4">
      <legend class="px-0 text-capitalize">${title}</legend>
    </div>
  `
}