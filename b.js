
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

const spinBtn = document.getElementById("spinBtn");
const nameInput = document.getElementById("nameInput");
const bulkInput = document.getElementById("bulkInput");
const participantList = document.getElementById("participantList");
const participantCount = document.getElementById("participantCount");
const winnerCard = document.getElementById("winnerCard");
const winnerName = document.getElementById("winnerName");

const colors = [
    "#793cff", "#ff3cac", "#13cfc2", "#ff9f43",
    "#3977ff", "#a8ff3e", "#f65375", "#25b8ff"
];

let participants = ["Ali", "Vali", "Malika", "Aziz", "Madina", "Jasur"];
let history = [];
let rotation = 0;
let spinning = false;
let audioContext;

function drawWheel() {
    const center = canvas.width / 2;
    const radius = center - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(rotation);

    if (participants.length === 0) {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#171d30";
        ctx.fill();
        ctx.fillStyle = "#38f6e5";
        ctx.font = "bold 26px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Ism qo‘shing", 0, 0);
        ctx.restore();
        return;
    }

    const arc = Math.PI * 2 / participants.length;

    participants.forEach((name, index) => {
        const start = -Math.PI / 2 + index * arc;
        const end = start + arc;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        ctx.strokeStyle = "#ffffffaa";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.rotate(start + arc / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(10, Math.min(21, 28 - participants.length * 0.25))}px Arial`;

        let label = name;
        while (ctx.measureText(label).width > radius * 0.65 && label.length > 3) {
            label = label.slice(0, -2) + "…";
        }

        ctx.fillText(label, radius - 28, 0, radius * 0.65);
        ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 7;
    ctx.stroke();

    ctx.restore();
}

function renderParticipants() {
    participantList.innerHTML = "";

    participants.forEach((name, index) => {
        const li = document.createElement("li");
        const text = document.createElement("span");
        text.className = "person-name";
        text.textContent = "✦ " + name;

        const remove = document.createElement("button");
        remove.className = "remove-btn";
        remove.textContent = "×";
        remove.title = "Ismni o‘chirish";

        remove.addEventListener("click", () => {
            if (spinning) return;
            participants.splice(index, 1);
            renderAll();
        });

        li.append(text, remove);
        participantList.appendChild(li);
    });

    participantCount.textContent = participants.length;
    document.getElementById("emptyMessage").hidden = participants.length > 0;
    spinBtn.disabled = spinning || participants.length === 0;
}

function renderHistory() {
    const list = document.getElementById("historyList");
    list.innerHTML = "";

    history.forEach((item, index) => {
        const li = document.createElement("li");
        li.innerHTML = "";

        const number = document.createElement("span");
        number.textContent = `${history.length - index}.`;

        const name = document.createElement("span");
        name.className = "history-name";
        name.textContent = item.name;

        const time = document.createElement("small");
        time.textContent = item.time;
        time.style.color = "#8991ad";

        li.append(number, name, time);
        list.appendChild(li);
    });

    document.getElementById("historyEmpty").hidden = history.length > 0;
}

function renderAll() {
    renderParticipants();
    renderHistory();
    drawWheel();
}

function addNames(names) {
    const cleaned = names.map(name => name.trim()).filter(Boolean);

    if (!cleaned.length) {
        alert("Avval ism kiriting!");
        return;
    }

    if (participants.length + cleaned.length > 150) {
        alert("Ko‘pi bilan 150 ta ism qo‘shish mumkin.");
        return;
    }

    participants.push(...cleaned);
    renderAll();
}

document.getElementById("addForm").addEventListener("submit", event => {
    event.preventDefault();
    if (spinning) return;

    const name = nameInput.value.trim();
    if (!name) return alert("Ism kiriting!");

    addNames([name]);
    nameInput.value = "";
    nameInput.focus();
});

document.getElementById("bulkAddBtn").addEventListener("click", () => {
    if (spinning) return;
    addNames(bulkInput.value.split(/\r?\n|,/));
    bulkInput.value = "";
});

document.getElementById("clearBtn").addEventListener("click", () => {
    if (spinning || !participants.length) return;
    if (!confirm("Barcha ismlarni o‘chiraymi?")) return;

    participants = [];
    winnerCard.hidden = true;
    document.getElementById("status").textContent = "Yangi ismlar qo‘shing.";
    renderAll();
});

document.getElementById("clearHistoryBtn").addEventListener("click", () => {
    if (!history.length) return;
    if (!confirm("G‘oliblar tarixini tozalaymi?")) return;

    history = [];
    renderHistory();
});

document.getElementById("dismissWinner").addEventListener("click", () => {
    winnerCard.hidden = true;
});

function playTone(frequency, duration, volume = 0.04) {
    try {
        audioContext = audioContext ||
            new (window.AudioContext || window.webkitAudioContext)();

        if (audioContext.state === "suspended") audioContext.resume();

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001, audioContext.currentTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
        // Ovoz ishlamasa ham baraban ishlayveradi.
    }
}

function spinWheel() {
    if (spinning || participants.length === 0) return;

    spinning = true;
    spinBtn.disabled = true;
    winnerCard.hidden = true;
    document.getElementById("status").textContent = "Baraban aylanmoqda...";

    const chosenIndex = Math.floor(Math.random() * participants.length);
    const arc = Math.PI * 2 / participants.length;
    const desiredAngle = -Math.PI / 2 - (chosenIndex + 0.5) * arc;

    const current = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const target = ((desiredAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    let delta = target - current;
    if (delta < 0) delta += Math.PI * 2;

    const startRotation = rotation;
    const totalRotation = delta + (5 + Math.floor(Math.random() * 3)) * Math.PI * 2;
    const startTime = performance.now();
    const duration = 4700;

    function animate(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);

        rotation = startRotation + totalRotation * eased;
        drawWheel();

        if (progress < 1) {
            if (Math.random() < 0.25) playTone(420, 0.03, 0.01);
            requestAnimationFrame(animate);
            return;
        }

        rotation = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        spinning = false;

        const winner = participants[chosenIndex];

        history.unshift({
            name: winner,
            time: new Date().toLocaleTimeString("uz-UZ", {
                hour: "2-digit",
                minute: "2-digit"
            })
        });

        if (history.length > 20) history.pop();

        winnerName.textContent = winner;
        winnerCard.hidden = false;
        document.getElementById("status").textContent = "Tabriklaymiz! G‘olib aniqlandi.";

        playTone(660, 0.16);
        setTimeout(() => playTone(880, 0.22), 150);

        // G‘olibni ishtirokchilar ro‘yxatidan olib tashlash.
        participants.splice(chosenIndex, 1);
        renderAll();

        if (!participants.length) {
            document.getElementById("status").textContent =
                "Barcha ishtirokchilar g‘olib bo‘ldi. Yangi ismlar qo‘shing.";
        }
    }

    requestAnimationFrame(animate);
}

spinBtn.addEventListener("click", spinWheel);

document.getElementById("fullscreenBtn").addEventListener("click", async () => {
    try {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
        } else {
            await document.exitFullscreen();
        }
    } catch (error) {
        alert("To‘liq ekran rejimi bu brauzerda ishlamadi.");
    }
});

drawWheel();
renderAll();
