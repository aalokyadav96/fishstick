const Input = ({ label, type = 'text', id, placeholder, required, onInput }) => {
    const container = document.createElement('div');
    container.className = 'input-field';
  
    if (label) {
      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      container.appendChild(labelEl);
    }
  
    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.placeholder = placeholder;
    input.required = required;
  
    input.addEventListener('input', (e) => {
      if (onInput) onInput(e.target.value);
    });
  
    container.appendChild(input);
    return container;
  };
  
  export default Input;
  