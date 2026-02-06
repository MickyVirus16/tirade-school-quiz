// Global Variables
let currentQuestion = 0;
let userAnswers = [];
let score = 0;
let timerInterval;
let totalTime = 3600; // 1 तास
let timeRemaining = totalTime;
let quizSubmitted = false;
let studentData = null;
let autoSaveInterval;

// पर्याय अक्षरांसाठी मॅपिंग
const optionLetters = ["अ", "ब", "क", "ड"];

// Local Storage Keys
const STORAGE_KEYS = {
    STUDENT: 'quiz_student_data',
    ANSWERS: 'quiz_user_answers',
    TIME: 'quiz_time_remaining',
    CURRENT_Q: 'quiz_current_question',
    SUBMITTED: 'quiz_submitted'
};

// Page Load
window.onload = function() {
    checkExistingSession();
};

// Check for existing session
function checkExistingSession() {
    const savedStudent = localStorage.getItem(STORAGE_KEYS.STUDENT);
    const savedAnswers = localStorage.getItem(STORAGE_KEYS.ANSWERS);
    
    if (savedStudent && savedAnswers) {
        document.getElementById('resumeMessage').style.display = 'block';
    }
}

// Login Student
function loginStudent() {
    const name = document.getElementById('studentName').value.trim();
    const className = document.getElementById('studentClass').value;
    const roll = document.getElementById('studentRoll').value.trim();
    
    if (!name || !className || !roll) {
        alert('कृपया सर्व माहिती भरा!');
        return;
    }
    
    studentData = {
        name: name,
        class: className,
        roll: roll,
        loginTime: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.STUDENT, JSON.stringify(studentData));
    
    // Show quiz section
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('quizSection').style.display = 'block';
    
    // Display student info
    document.getElementById('displayName').textContent = `नाव: ${name}`;
    document.getElementById('displayClass').textContent = `वर्ग: ${className}`;
    document.getElementById('displayRoll').textContent = `रोल नंबर: ${roll}`;
    
    // Start fresh quiz
    initQuiz();
}

// Resume Quiz
function resumeQuiz() {
    const savedStudent = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENT));
    const savedAnswers = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANSWERS));
    const savedTime = parseInt(localStorage.getItem(STORAGE_KEYS.TIME));
    const savedCurrentQ = parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_Q));
    
    if (!savedStudent || !savedAnswers) {
        alert('माहिती मिळाली नाही. कृपया नवीन लॉगिन करा.');
        return;
    }
    
    studentData = savedStudent;
    userAnswers = savedAnswers;
    timeRemaining = savedTime || totalTime;
    currentQuestion = savedCurrentQ || 0;
    
    // Show quiz section
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('quizSection').style.display = 'block';
    
    // Display student info
    document.getElementById('displayName').textContent = `नाव: ${studentData.name}`;
    document.getElementById('displayClass').textContent = `वर्ग: ${studentData.class}`;
    document.getElementById('displayRoll').textContent = `रोल नंबर: ${studentData.roll}`;
    
    initQuiz(true); // true = resume mode
}

// Start New Quiz
function startNewQuiz() {
    // Clear old data
    clearQuizData();
    document.getElementById('resumeMessage').style.display = 'none';
}

// Logout
function logout() {
    if (confirm('तुम्हाला खरंच लॉगआउट करायचे आहे? तुमची उत्तरे सेव्ह राहतील.')) {
        location.reload();
    }
}

// Initialize Quiz
function initQuiz(isResume = false) {
    if (typeof questions === 'undefined' || questions.length === 0) {
        alert("प्रश्न लोड होत आहेत... कृपया प्रतीक्षा करा!");
        return;
    }
    
    if (!isResume) {
        userAnswers = new Array(questions.length).fill(null);
        timeRemaining = totalTime;
        currentQuestion = 0;
    }
    
    const container = document.getElementById('quizContainer');
    container.innerHTML = '';

    questions.forEach((q, index) => {
        const questionCard = document.createElement('div');
        questionCard.className = `question-card ${index === currentQuestion ? 'active' : ''}`;
        questionCard.id = `question-${index}`;
        
        let optionsHtml = '';
        q.options.forEach((opt, optIndex) => {
            const letter = optionLetters[optIndex];
            const isSelected = userAnswers[index] === letter ? 'selected' : '';
            optionsHtml += `
                <div class="option ${isSelected}" onclick="selectOption(${index}, '${letter}')" id="option-${index}-${letter}">
                    <span class="option-letter">${letter}</span>
                    <span>${opt}</span>
                </div>
            `;
        });

        questionCard.innerHTML = `
            <span class="question-number">प्रश्न ${index + 1} / ${questions.length}</span>
            <div class="question-text">${q.question}</div>
            <div class="options">${optionsHtml}</div>
        `;
        
        container.appendChild(questionCard);
    });

    // Navigation dots
    const navDiv = document.createElement('div');
    navDiv.className = 'navigation';
    questions.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `nav-dot ${index === currentQuestion ? 'active' : ''} ${userAnswers[index] ? 'answered' : ''}`;
        dot.textContent = index + 1;
        dot.onclick = () => goToQuestion(index);
        navDiv.appendChild(dot);
    });
    container.appendChild(navDiv);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML = `
        <button class="btn btn-secondary" onclick="prevQuestion()" id="prevBtn">मागे</button>
        <button class="btn" onclick="nextQuestion()" id="nextBtn">पुढे</button>
        <button class="btn" onclick="submitQuiz()" id="submitBtn" style="display:none;">सबमिट करा</button>
    `;
    container.appendChild(controls);

    startTimer();
    updateProgress();
    startAutoSave();
}

// Select Option
function selectOption(qIndex, letter) {
    if (quizSubmitted) return;
    
    userAnswers[qIndex] = letter;
    
    // Update UI
    const options = document.querySelectorAll(`#question-${qIndex} .option`);
    options.forEach(opt => opt.classList.remove('selected'));
    document.getElementById(`option-${qIndex}-${letter}`).classList.add('selected');
    
    updateNavDots();
    saveProgress();
    
    // Show save notification
    showSaveNotification();
}

// Show Save Notification
function showSaveNotification() {
    const notif = document.getElementById('saveNotification');
    notif.style.display = 'block';
    setTimeout(() => {
        notif.style.display = 'none';
    }, 2000);
}

// Save Progress to LocalStorage
function saveProgress() {
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify(userAnswers));
    localStorage.setItem(STORAGE_KEYS.TIME, timeRemaining.toString());
    localStorage.setItem(STORAGE_KEYS.CURRENT_Q, currentQuestion.toString());
}

// Auto Save every 30 seconds
function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        if (!quizSubmitted) {
            saveProgress();
            console.log('Auto-saved at:', new Date().toLocaleTimeString());
        }
    }, 30000); // 30 seconds
}

// Navigation
function goToQuestion(index) {
    document.querySelectorAll('.question-card').forEach(card => card.classList.remove('active'));
    document.querySelectorAll('.nav-dot').forEach(dot => dot.classList.remove('active'));
    
    document.getElementById(`question-${index}`).classList.add('active');
    document.querySelectorAll('.nav-dot')[index].classList.add('active');
    
    currentQuestion = index;
    updateButtons();
    updateProgress();
    saveProgress();
}

function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        goToQuestion(currentQuestion + 1);
    }
}

function prevQuestion() {
    if (currentQuestion > 0) {
        goToQuestion(currentQuestion - 1);
    }
}

function updateButtons() {
    document.getElementById('prevBtn').disabled = currentQuestion === 0;
    
    if (currentQuestion === questions.length - 1) {
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('submitBtn').style.display = 'inline-block';
    } else {
        document.getElementById('nextBtn').style.display = 'inline-block';
        document.getElementById('submitBtn').style.display = 'none';
    }
}

function updateNavDots() {
    const dots = document.querySelectorAll('.nav-dot');
    userAnswers.forEach((answer, index) => {
        if (answer !== null) {
            dots[index].classList.add('answered');
        }
    });
}

function updateProgress() {
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

// Timer
function startTimer() {
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        saveProgress(); // Save time every second
        
        if (timeRemaining <= 300 && timeRemaining > 60) {
            document.getElementById('timer').classList.add('warning');
        } else if (timeRemaining <= 60) {
            document.getElementById('timer').classList.remove('warning');
            document.getElementById('timer').classList.add('danger');
        }
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            autoSubmit();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    document.getElementById('timer').textContent = 
        `वेळ: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function autoSubmit() {
    alert("वेळ संपली! तुमचे उत्तर आपोआप सबमिट केले जात आहे.");
    submitQuiz();
}

// Submit Quiz
function submitQuiz() {
    if (quizSubmitted) return;
    quizSubmitted = true;
    
    clearInterval(timerInterval);
    clearInterval(autoSaveInterval);
    
    // Calculate score
    score = 0;
    userAnswers.forEach((answer, index) => {
        if (answer === questions[index].correct) {
            score++;
        }
    });

    // Mark as submitted
    localStorage.setItem(STORAGE_KEYS.SUBMITTED, 'true');
    
    // Time used
    const timeUsed = totalTime - timeRemaining;
    const minsUsed = Math.floor(timeUsed / 60);
    const secsUsed = timeUsed % 60;

    // Show results
    document.getElementById('quizContainer').style.display = 'none';
    document.getElementById('resultContainer').classList.add('show');
    document.getElementById('scoreNumber').textContent = score;
    
    // Student result info
    document.getElementById('studentResultInfo').innerHTML = `
        <strong>विद्यार्थी:</strong> ${studentData.name} | 
        <strong>वर्ग:</strong> ${studentData.class} | 
        <strong>रोल नंबर:</strong> ${studentData.roll}
    `;
    
    document.getElementById('timeTaken').textContent = 
        `वापरलेली वेळ: ${minsUsed} मिनिटे ${secsUsed} सेकंद`;
    
    // Message
    let message = '';
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) message = '🎉 उत्तम! अभिनंदन! (A ग्रेड)';
    else if (percentage >= 60) message = '👍 चांगले! (B ग्रेड)';
    else if (percentage >= 40) message = '📚 ठीक आहे. (C ग्रेड)';
    else message = '💪 हार मानू नका! पुन्हा प्रयत्न करा.';
    
    document.getElementById('resultMessage').textContent = message;

    // Detailed review
    const reviewList = document.getElementById('reviewList');
    reviewList.innerHTML = '';
    
    questions.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === q.correct;
        
        const correctIndex = optionLetters.indexOf(q.correct);
        const correctOptionText = q.options[correctIndex];
        
        let userAnswerText = 'उत्तर दिले नाही';
        if (userAnswer !== null) {
            const userIndex = optionLetters.indexOf(userAnswer);
            userAnswerText = `${userAnswer}) ${q.options[userIndex]}`;
        }
        
        const reviewItem = document.createElement('div');
        reviewItem.className = `review-item ${isCorrect ? 'correct' : 'wrong'}`;
        reviewItem.innerHTML = `
            <strong>प्रश्न ${index + 1}:</strong> ${q.question.replace(/^\d+\.\s*/, '')}<br>
            <span style="color: ${isCorrect ? '#4caf50' : '#f44336'}">
                ${isCorrect ? '✓ बरोबर' : '✗ चुकीचे'}<br>
                तुमचे उत्तर: ${userAnswerText}<br>
                ${!isCorrect ? `बरोबर उत्तर: ${q.correct}) ${correctOptionText}` : ''}
            </span>
        `;
        reviewList.appendChild(reviewItem);
    });
    
    // Save final result
    saveFinalResult();
}

// Save Final Result
function saveFinalResult() {
    const resultData = {
        student: studentData,
        score: score,
        total: questions.length,
        percentage: ((score / questions.length) * 100).toFixed(2),
        timeUsed: totalTime - timeRemaining,
        answers: userAnswers,
        submittedAt: new Date().toISOString()
    };
    
    // Save to localStorage (can be exported)
    const allResults = JSON.parse(localStorage.getItem('quiz_all_results') || '[]');
    allResults.push(resultData);
    localStorage.setItem('quiz_all_results', JSON.stringify(allResults));
}

// Download Certificate
function downloadCertificate() {
    const percentage = ((score / questions.length) * 100).toFixed(2);
    const date = new Date().toLocaleDateString('mr-IN');
    
    const certificateContent = `
========================================
     शासकीय माध्यमिक आश्रम शाळा तिरडे
----------------------------------------
        प्रमाणपत्र
========================================

विद्यार्थ्याचे नाव: ${studentData.name}
वर्ग: ${studentData.class}
रोल नंबर: ${studentData.roll}

चाचणी: Indian Constitution Awareness Quiz
प्रश्न संख्या: 100
मिळालेले गुण: ${score}/100
टक्केवारी: ${percentage}%
दिनांक: ${date}

========================================
              शिक्षकाची स्वाक्षरी
========================================
    `;
    
    const blob = new Blob([certificateContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificate_${studentData.name}_${studentData.roll}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Restart Quiz
function restartQuiz() {
    if (confirm('नवीन चाचणी सुरू करायची? जुनी माहिती काढून टाकली जाईल.')) {
        clearQuizData();
        location.reload();
    }
}

// Clear Quiz Data
function clearQuizData() {
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    localStorage.removeItem('quiz_all_results');
}
