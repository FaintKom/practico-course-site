// ═══════════════════════════════════════════════════════════════
// Practico Interactive Components for Lesson Sites
// ═══════════════════════════════════════════════════════════════

// ─── 1. INLINE QUIZ ────────────────────────────────────────────
// Usage: <div class="inline-quiz" data-quiz='[{...}]'></div>
// Each question: { question, options: [], correct: 0-based index, explanation }
function initInlineQuizzes() {
    document.querySelectorAll('.inline-quiz').forEach(container => {
        const questions = JSON.parse(container.dataset.quiz);
        let current = 0;
        let score = 0;
        let answered = new Set();

        function render() {
            if (current >= questions.length) {
                const pct = Math.round((score / questions.length) * 100);
                const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪';
                container.innerHTML = `
                    <div class="quiz-result">
                        <div class="quiz-result-emoji">${emoji}</div>
                        <div class="quiz-result-score">${score} из ${questions.length}</div>
                        <div class="quiz-result-text">${pct >= 80 ? 'Отлично! Вы хорошо усвоили материал.' : pct >= 50 ? 'Неплохо! Но есть что повторить.' : 'Стоит вернуться к материалу и попробовать снова.'}</div>
                        <button class="quiz-btn quiz-btn-primary" onclick="this.closest('.inline-quiz').__quizReset()">Пройти ещё раз</button>
                    </div>`;
                return;
            }

            const q = questions[current];
            container.innerHTML = `
                <div class="quiz-header">
                    <span class="quiz-counter">${current + 1} / ${questions.length}</span>
                    <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${(current / questions.length) * 100}%"></div></div>
                </div>
                <div class="quiz-question">${q.question}</div>
                <div class="quiz-options">
                    ${q.options.map((opt, i) => `
                        <button class="quiz-option" data-idx="${i}">${opt}</button>
                    `).join('')}
                </div>
                <div class="quiz-feedback" style="display:none;"></div>
                <button class="quiz-btn quiz-btn-next" style="display:none;">Далее →</button>`;

            container.querySelectorAll('.quiz-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (answered.has(current)) return;
                    answered.add(current);
                    const idx = parseInt(btn.dataset.idx);
                    const isCorrect = idx === q.correct;
                    if (isCorrect) score++;

                    container.querySelectorAll('.quiz-option').forEach((b, i) => {
                        b.classList.add('quiz-option-disabled');
                        if (i === q.correct) b.classList.add('quiz-option-correct');
                        if (i === idx && !isCorrect) b.classList.add('quiz-option-wrong');
                    });

                    const feedback = container.querySelector('.quiz-feedback');
                    feedback.style.display = 'block';
                    feedback.className = 'quiz-feedback ' + (isCorrect ? 'quiz-feedback-correct' : 'quiz-feedback-wrong');
                    feedback.innerHTML = `<strong>${isCorrect ? '✅ Верно!' : '❌ Неверно.'}</strong> ${q.explanation}`;

                    container.querySelector('.quiz-btn-next').style.display = 'inline-block';
                });
            });

            container.querySelector('.quiz-btn-next').addEventListener('click', () => {
                current++;
                render();
            });
        }

        container.__quizReset = () => { current = 0; score = 0; answered.clear(); render(); };
        render();
    });
}

// ─── 2. PROMPT BUILDER (drag/toggle constructor) ───────────────
// Usage: <div class="prompt-builder" data-config='{"base":"...", "elements":[...]}'>
function initPromptBuilders() {
    document.querySelectorAll('.prompt-builder').forEach(container => {
        const config = JSON.parse(container.dataset.config);
        const elements = config.elements; // [{id, label, color, text, icon}]
        const activeSet = new Set();

        function render() {
            const toggles = elements.map(el => `
                <button class="pb-toggle ${activeSet.has(el.id) ? 'pb-toggle-active' : ''}"
                        data-id="${el.id}"
                        style="--toggle-color: ${el.color}; --toggle-bg: ${el.color}15;">
                    <span class="pb-toggle-icon">${el.icon || '+'}</span>
                    <span class="pb-toggle-label">${el.label}</span>
                </button>
            `).join('');

            let promptParts = [];
            if (activeSet.has('role')) promptParts.push(elements.find(e => e.id === 'role').text);
            if (activeSet.has('context')) promptParts.push(elements.find(e => e.id === 'context').text);
            if (activeSet.has('instructions')) promptParts.push(elements.find(e => e.id === 'instructions').text);
            if (activeSet.has('input')) promptParts.push(elements.find(e => e.id === 'input').text);
            if (activeSet.has('format')) promptParts.push(elements.find(e => e.id === 'format').text);

            const prompt = promptParts.length ? promptParts.join('\n\n') : config.base;
            const quality = activeSet.size;
            const qualityLabels = ['😐 Базовый', '🙂 Лучше', '👍 Хорошо', '🎯 Отлично', '🔥 Идеально'];
            const qualityColors = ['#9CA3AF', '#ff6805', '#ff6805', '#2e8749', '#0080ff'];

            container.innerHTML = `
                <div class="pb-controls">
                    <div class="pb-label">Включите элементы промпта:</div>
                    <div class="pb-toggles">${toggles}</div>
                </div>
                <div class="pb-preview">
                    <div class="pb-quality">
                        <span style="color:${qualityColors[Math.min(quality, 4)]}; font-weight:700;">
                            ${qualityLabels[Math.min(quality, 4)]}
                        </span>
                        <span class="pb-quality-bar">
                            ${[0,1,2,3,4].map(i => `<span class="pb-quality-dot" style="background:${i < quality ? qualityColors[Math.min(quality, 4)] : '#E5E7EB'};"></span>`).join('')}
                        </span>
                    </div>
                    <pre class="pb-prompt">${escapeHtml(prompt)}</pre>
                </div>`;

            container.querySelectorAll('.pb-toggle').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    if (activeSet.has(id)) activeSet.delete(id); else activeSet.add(id);
                    render();
                });
            });
        }
        render();
    });
}

// ─── 3. BEFORE/AFTER PROMPT EDITOR ─────────────────────────────
// Usage: <div class="prompt-improver" data-config='{"bad":"...", "good":"...", "highlights":[...]}'>
function initPromptImprovers() {
    document.querySelectorAll('.prompt-improver').forEach(container => {
        const config = JSON.parse(container.dataset.config);
        let showImproved = false;

        function render() {
            container.innerHTML = `
                <div class="pi-switch">
                    <button class="pi-tab ${!showImproved ? 'pi-tab-active pi-tab-bad' : ''}" data-mode="bad">❌ До</button>
                    <button class="pi-tab ${showImproved ? 'pi-tab-active pi-tab-good' : ''}" data-mode="good">✅ После</button>
                </div>
                <div class="pi-content">
                    <pre class="pi-prompt">${showImproved ? highlightText(config.good, config.highlights) : escapeHtml(config.bad)}</pre>
                </div>
                ${showImproved ? `<div class="pi-improvements">
                    ${config.highlights.map(h => `<span class="pi-tag" style="background:${h.color}20; color:${h.color}; border:1px solid ${h.color}40;">${h.label}</span>`).join('')}
                </div>` : '<div class="pi-hint">👆 Нажмите «После» чтобы увидеть улучшения</div>'}`;

            container.querySelectorAll('.pi-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    showImproved = tab.dataset.mode === 'good';
                    render();
                });
            });
        }
        render();
    });
}

function highlightText(text, highlights) {
    let result = escapeHtml(text);
    highlights.forEach(h => {
        if (h.match) {
            const escaped = escapeHtml(h.match);
            result = result.replace(escaped, `<mark style="background:${h.color}25; border-bottom:2px solid ${h.color}; padding:2px 0;">${escaped}</mark>`);
        }
    });
    return result;
}

// ─── 4. FRAMEWORK PICKER ───────────────────────────────────────
// Usage: <div class="framework-picker" data-config='{"task":"...", "frameworks":[...]}'>
function initFrameworkPickers() {
    document.querySelectorAll('.framework-picker').forEach(container => {
        const config = JSON.parse(container.dataset.config);
        let selected = null;

        function render() {
            const fw = selected ? config.frameworks.find(f => f.id === selected) : null;
            container.innerHTML = `
                <div class="fp-task">
                    <div class="fp-task-label">📋 Задача:</div>
                    <div class="fp-task-text">${config.task}</div>
                </div>
                <div class="fp-options">
                    ${config.frameworks.map(f => `
                        <button class="fp-option ${selected === f.id ? 'fp-option-active' : ''}" data-id="${f.id}" style="--fw-color:${f.color};">
                            <span class="fp-option-name">${f.name}</span>
                            <span class="fp-option-desc">${f.shortDesc}</span>
                        </button>
                    `).join('')}
                </div>
                ${fw ? `
                <div class="fp-result" style="border-left: 4px solid ${fw.color};">
                    <div class="fp-result-title" style="color:${fw.color};">${fw.name}</div>
                    <pre class="fp-result-prompt">${escapeHtml(fw.prompt)}</pre>
                </div>` : '<div class="fp-hint">👆 Выберите фреймворк, чтобы увидеть промпт</div>'}`;

            container.querySelectorAll('.fp-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    selected = btn.dataset.id;
                    render();
                });
            });
        }
        render();
    });
}

// ─── 5. COT STEPPER (Chain-of-Thought animated) ────────────────
// Usage: <div class="cot-stepper" data-config='{"question":"...", "steps":[...], "answer":"..."}'>
function initCotSteppers() {
    document.querySelectorAll('.cot-stepper').forEach(container => {
        const config = JSON.parse(container.dataset.config);
        let visibleSteps = 0;

        function render() {
            container.innerHTML = `
                <div class="cot-question">${config.question}</div>
                <div class="cot-steps">
                    ${config.steps.map((step, i) => `
                        <div class="cot-step ${i < visibleSteps ? 'cot-step-visible' : 'cot-step-hidden'}">
                            <div class="cot-step-num">Шаг ${i + 1}</div>
                            <div class="cot-step-text">${step}</div>
                        </div>
                        ${i < config.steps.length - 1 ? `<div class="cot-arrow ${i < visibleSteps - 1 ? 'cot-arrow-visible' : ''}">↓</div>` : ''}
                    `).join('')}
                </div>
                ${visibleSteps >= config.steps.length ? `
                    <div class="cot-answer">
                        <strong>💡 Ответ:</strong> ${config.answer}
                    </div>
                ` : ''}
                <div class="cot-controls">
                    ${visibleSteps < config.steps.length ?
                        `<button class="quiz-btn quiz-btn-primary cot-next">Следующий шаг →</button>` :
                        `<button class="quiz-btn cot-reset">Начать заново</button>`
                    }
                </div>`;

            const nextBtn = container.querySelector('.cot-next');
            if (nextBtn) nextBtn.addEventListener('click', () => { visibleSteps++; render(); });
            const resetBtn = container.querySelector('.cot-reset');
            if (resetBtn) resetBtn.addEventListener('click', () => { visibleSteps = 0; render(); });
        }
        render();
    });
}

// ─── UTILS ─────────────────────────────────────────────────────
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ─── INIT ALL ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initInlineQuizzes();
    initPromptBuilders();
    initPromptImprovers();
    initFrameworkPickers();
    initCotSteppers();
});
