class Calculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.clear();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
    }

    delete() {
        if (this.currentOperand === '0') return;
        if (this.currentOperand.length === 1) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.slice(0, -1);
        }
    }

    appendNumber(number) {
        if (number === '.' && this.currentOperand.includes('.')) return;

        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number;
        } else {
            this.currentOperand += number;
        }
    }

    chooseOperation(operation) {
        if (this.currentOperand === '') return;

        if (this.previousOperand !== '') {
            this.compute();
        }

        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '0';
    }

    compute() {
        let result;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);

        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '*':
                result = prev * current;
                break;
            case '/':
                if (current === 0) {
                    this.currentOperand = 'Errore';
                    this.previousOperand = '';
                    this.operation = undefined;
                    return;
                }
                result = prev / current;
                break;
            default:
                return;
        }

        this.currentOperand = this.formatResult(result);
        this.operation = undefined;
        this.previousOperand = '';
    }

    formatResult(number) {
        if (Math.abs(number) > 999999999999) {
            return number.toExponential(6);
        }

        const rounded = Math.round(number * 1e10) / 1e10;
        return rounded.toString();
    }

    getDisplayNumber(number) {
        if (number === 'Errore') return 'Errore';

        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];

        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('it-IT', {
                maximumFractionDigits: 0
            });
        }

        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }

    updateDisplay() {
        this.currentOperandElement.textContent = this.getDisplayNumber(this.currentOperand);

        if (this.operation != null) {
            const operatorSymbol = this.getOperatorSymbol(this.operation);
            this.previousOperandElement.textContent =
                `${this.getDisplayNumber(this.previousOperand)} ${operatorSymbol}`;
        } else {
            this.previousOperandElement.textContent = '';
        }
    }

    getOperatorSymbol(op) {
        const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
        return symbols[op] || op;
    }
}

const previousOperandElement = document.querySelector('.previous-operand');
const currentOperandElement = document.querySelector('.current-operand');
const calculator = new Calculator(previousOperandElement, currentOperandElement);

document.querySelector('.buttons').addEventListener('click', (e) => {
    const button = e.target.closest('.btn');
    if (!button) return;

    const action = button.dataset.action;
    const value = button.dataset.value;

    switch (action) {
        case 'number':
            calculator.appendNumber(value);
            break;
        case 'operator':
            calculator.chooseOperation(value);
            break;
        case 'equals':
            calculator.compute();
            break;
        case 'clear':
            calculator.clear();
            break;
        case 'delete':
            calculator.delete();
            break;
        case 'decimal':
            calculator.appendNumber(value);
            break;
    }

    calculator.updateDisplay();
});

document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') {
        calculator.appendNumber(e.key);
    } else if (e.key === '.') {
        calculator.appendNumber('.');
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        calculator.chooseOperation(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculator.compute();
    } else if (e.key === 'Backspace') {
        calculator.delete();
    } else if (e.key === 'Escape') {
        calculator.clear();
    } else {
        return;
    }

    calculator.updateDisplay();
});
