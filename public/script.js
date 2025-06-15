const form = document.getElementById('questionForm');
const steps = document.querySelectorAll('.step');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const submitBtn = document.getElementById('submitBtn');
const result = document.getElementById('result');

let currentStep = 0;
let isAuthenticated = false;

function showStep(index) {
    steps.forEach((step, i) => {
        step.classList.toggle('active', i === index);
    });

    prevBtn.disabled = index === 0;
    nextBtn.style.display = index < steps.length - 1 ? 'inline-block' : 'none';
    submitBtn.style.display = index === steps.length - 1 ? 'inline-block' : 'none';

    const firstInput = steps[index].querySelector('input, select, textarea');
    if (firstInput) {
        firstInput.focus();
    }
}

nextBtn.addEventListener('click', async () => {
    const currentInput = steps[currentStep].querySelector('input, select, textarea');
    if (!currentInput.checkValidity()) {
        currentInput.reportValidity();
        return;
    }

    if (currentStep === 0) {
        // Первый шаг: проверяем пароль через сервер
        const password = currentInput.value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    isAuthenticated = true;
                    result.textContent = '';
                    currentStep++;
                    showStep(currentStep);
                } else {
                    result.textContent = 'Неверный пароль.';
                }
            } else {
                result.textContent = 'Ошибка при авторизации.';
            }
        } catch {
            result.textContent = 'Сервер не отвечает.';
        }
    } else {
        currentStep++;
        showStep(currentStep);
    }
});

prevBtn.addEventListener('click', () => {
    currentStep--;
    showStep(currentStep);
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
        result.textContent = 'Сначала авторизуйтесь.';
        return;
    }

    const formData = new FormData(form);
    const {password, ...data} = Object.fromEntries(formData.entries());

    const now = new Date();
    data.currentDate = now.toISOString().split('T')[0];
    data.currentTime = now.toTimeString().split(' ')[0];

    try {
        const response = await fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            result.textContent = 'Данные успешно отправлены!';
            form.reset();
            currentStep = 1; // Возврат не к паролю, а ко второму шагу
            showStep(currentStep);
        } else {
            result.textContent = 'Ошибка при отправке. Попробуйте снова.';
        }
    } catch {
        result.textContent = 'Сервер не отвечает.';
    }
});

showStep(currentStep);
