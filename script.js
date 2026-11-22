
/* =====================================
   VIRTUAL MEMORY SIMULATOR
   ADDRESS TRANSLATION + TLB + RAM
   DYNAMIC ALLOCATION + FIFO
   BINARY ADDRESS BREAKDOWN
   TRANSLATION HISTORY
   PERFORMANCE METRICS + ANIMATIONS
   LIVE FIFO VISUALIZATION
===================================== */


/* STEP 1: MEMORY CONFIGURATION */

const PAGE_SIZE = 4;
const TOTAL_FRAMES = 8;
const TLB_SIZE = 4;


/* STEP 2: ORIGINAL PAGE TABLE */

// 10 virtual pages: Page 0 to Page 9
// 8 physical frames: Frame 0 to Frame 7

const initialPageTable = {
    0: 2,
    1: 4,
    2: null,
    3: 5,
    4: null,
    5: 6,
    6: 3,
    7: 7,
    8: null,
    9: null
};

const pageTable = { ...initialPageTable };


/* STEP 3: TLB AND STATISTICS */

let tlb = [];

let tlbHitCount = 0;
let tlbMissCount = 0;
let totalTranslations = 0;
let pageFaultCount = 0;


/* STEP 4: PLAYER SCORE */

let playerScore = 0;
let streak = 0;


/* STEP 5: FIFO PAGE REPLACEMENT */

// Oldest page is at index 0.

let fifoQueue = ["0", "1", "3", "5", "6", "7"];

let fifoLastRemoved = null;
let fifoLastLoaded = null;
let fifoLastStatus = "Waiting for a page replacement...";


/* STEP 6: TRANSLATION HISTORY */

let translationHistory = [];


/* STEP 7: GET HTML ELEMENTS */

const addressInput = document.getElementById("virtualAddress");
const translateButton = document.getElementById("translateBtn");
const resetButton = document.getElementById("resetBtn");
const resultArea = document.querySelector(".translation-result");
const historyBody = document.getElementById("translationHistoryBody");

// Calculate the maximum virtual address automatically.

const TOTAL_VIRTUAL_PAGES = Object.keys(pageTable).length;

const MAX_VIRTUAL_ADDRESS =
    (PAGE_SIZE * TOTAL_VIRTUAL_PAGES) - 1;

// Automatically configure the address input.

if (addressInput) {
    addressInput.min = 0;
    addressInput.max = MAX_VIRTUAL_ADDRESS;
    addressInput.placeholder =
        `Enter address (0-${MAX_VIRTUAL_ADDRESS})`;
}


/* STEP 8: ANIMATION HELPER FUNCTIONS */

function playAnimation(element, className) {

    if (!element) return;

    element.classList.remove(className);

    void element.offsetWidth;

    element.classList.add(className);

    element.addEventListener("animationend", function handler() {
        element.classList.remove(className);
        element.removeEventListener("animationend", handler);
    });

}


function animateCounter(element) {
    playAnimation(element, "counter-update");
}


function animateTLB(status) {

    if (status === "TLB HIT") {

        const hitBox = document.getElementById("tlbHits");

        playAnimation(hitBox?.closest(".tlb-box"), "flash-hit");

    } else {

        const missBox = document.getElementById("tlbMisses");

        playAnimation(missBox?.closest(".tlb-box"), "flash-miss");

    }

}


function animateMemoryFrame(frameNumber) {

    const frame = document.getElementById(`frame-${frameNumber}`);

    playAnimation(frame, "frame-updated");

}


function animateResult() {
    playAnimation(resultArea, "result-show");
}


function animateHistoryRow() {

    if (!historyBody) return;

    const firstRow = historyBody.querySelector("tr");

    playAnimation(firstRow, "history-row-new");

}


/* STEP 9: PLAYER SCORE FUNCTIONS */

function updateScore(points) {

    playerScore += points;

    const scoreElement = document.getElementById("playerScore");

    if (scoreElement) {
        scoreElement.textContent = playerScore + " XP";
        animateCounter(scoreElement);
    }

    let rank = "Memory Apprentice";

    if (playerScore >= 100) rank = "Memory Engineer";
    if (playerScore >= 250) rank = "Memory Expert";
    if (playerScore >= 500) rank = "Master of Memory";

    const rankElement = document.getElementById("playerRank");

    if (rankElement) {
        rankElement.textContent = rank;
    }

}


function updateStreak() {

    streak++;

    const streakElement = document.getElementById("streakCount");

    if (streakElement) {
        streakElement.textContent = streak;
        animateCounter(streakElement);
    }

}


function resetStreak() {

    streak = 0;

    const streakElement = document.getElementById("streakCount");

    if (streakElement) {
        streakElement.textContent = streak;
    }

}


/* STEP 10: TRANSLATION HISTORY */

function addTranslationToHistory(
    virtualAddress,
    pageNumber,
    offset,
    frameNumber,
    physicalAddress,
    status
) {

    translationHistory.unshift({
        virtualAddress,
        pageNumber,
        offset,
        frameNumber,
        physicalAddress,
        status
    });

    displayTranslationHistory();

    animateHistoryRow();

}


function displayTranslationHistory() {

    if (!historyBody) return;

    historyBody.innerHTML = "";

    if (translationHistory.length === 0) {

        historyBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No translations yet
                </td>
            </tr>
        `;

        return;
    }

    translationHistory.forEach(record => {

        const row = document.createElement("tr");

        const values = [
            record.virtualAddress,
            record.pageNumber,
            record.offset,
            record.frameNumber,
            record.physicalAddress,
            record.status
        ];

        values.forEach((value, index) => {

            const cell = document.createElement("td");

            if (index === 5) {

                const label = document.createElement("span");

                label.textContent = value;

                if (value === "TLB HIT") {
                    label.className = "tlb-hit";
                } else if (value === "TLB MISS") {
                    label.className = "page-status";
                } else {
                    label.className = "page-status unmapped";
                }

                cell.appendChild(label);

            } else {

                cell.textContent = value;

            }

            row.appendChild(cell);

        });

        historyBody.appendChild(row);

    });

}


/* STEP 11: FIFO VISUALIZATION */

function displayFIFO() {

    const queueElement = document.getElementById("fifoQueue");
    const victimElement = document.getElementById("fifoVictim");
    const removedElement = document.getElementById("fifoRemoved");
    const loadedElement = document.getElementById("fifoLoaded");
    const statusElement = document.getElementById("fifoStatus");

    // Display FIFO queue.

    if (queueElement) {

        if (fifoQueue.length === 0) {

            queueElement.innerHTML = `
                <div class="fifo-empty">
                    FIFO queue is empty
                </div>
            `;

        } else {

            queueElement.innerHTML = fifoQueue.map((page, index) => {

                return `
                    <div class="fifo-item ${index === 0 ? "fifo-oldest" : ""}">

                        <span class="fifo-position">
                            ${index === 0 ? "NEXT" : index + 1}
                        </span>

                        <strong>Page ${page}</strong>

                        <small>
                            ${index === 0 ? "Oldest" : "Loaded"}
                        </small>

                    </div>
                `;

            }).join("");

        }

    }

    // Display next victim.

    if (victimElement) {

        victimElement.textContent =
            fifoQueue.length > 0
            ? "Page " + fifoQueue[0]
            : "--";

    }

    // Display last removed page.

    if (removedElement) {

        removedElement.textContent =
            fifoLastRemoved !== null
            ? "Page " + fifoLastRemoved
            : "--";

    }

    // Display last loaded page.

    if (loadedElement) {

        loadedElement.textContent =
            fifoLastLoaded !== null
            ? "Page " + fifoLastLoaded
            : "--";

    }

    // Display current FIFO status.

    if (statusElement) {

        statusElement.innerHTML = `
            <i class="fa-solid fa-circle-info"></i>
            <span>${fifoLastStatus}</span>
        `;

    }

}


/* STEP 12: DYNAMIC PAGE ALLOCATION + FIFO */

function loadPageIntoMemory(pageNumber) {

    let freeFrame = null;

    const occupiedFrames = Object.values(pageTable);

    // Find an available physical frame.

    for (let i = 0; i < TOTAL_FRAMES; i++) {

        if (!occupiedFrames.includes(i)) {
            freeFrame = i;
            break;
        }

    }

    let replacedPage = null;

    if (freeFrame !== null) {

        // FREE FRAME AVAILABLE.

        pageTable[pageNumber] = freeFrame;

        fifoQueue.push(String(pageNumber));

        fifoLastRemoved = null;
        fifoLastLoaded = pageNumber;

        fifoLastStatus =
            `Page ${pageNumber} loaded into free Frame ${freeFrame}. No replacement was required.`;

    } else {

        // ALL FRAMES ARE OCCUPIED.
        // APPLY FIFO REPLACEMENT.

        while (fifoQueue.length > 0) {

            const candidate = fifoQueue.shift();

            if (
                pageTable[candidate] !== null &&
                pageTable[candidate] !== undefined &&
                Number(candidate) !== Number(pageNumber)
            ) {

                replacedPage = candidate;
                break;

            }

        }

        // Fallback if the queue has no valid candidate.

        if (replacedPage === null) {

            replacedPage = Object.keys(pageTable).find(page =>
                pageTable[page] !== null &&
                Number(page) !== Number(pageNumber)
            );

            if (replacedPage !== undefined) {

                fifoQueue = fifoQueue.filter(
                    page => Number(page) !== Number(replacedPage)
                );

            }

        }

        if (replacedPage === undefined || replacedPage === null) {
            throw new Error("FIFO could not find a page to replace.");
        }

        // Reuse the victim's physical frame.

        const frameToReuse = pageTable[replacedPage];

        pageTable[replacedPage] = null;

        // Remove the old page from TLB.

        tlb = tlb.filter(
            entry => entry.page !== Number(replacedPage)
        );

        // Load the new page.

        pageTable[pageNumber] = frameToReuse;

        fifoQueue.push(String(pageNumber));

        freeFrame = frameToReuse;

        // Save replacement information.

        fifoLastRemoved = Number(replacedPage);
        fifoLastLoaded = pageNumber;

        fifoLastStatus =
            `FIFO replacement completed: Page ${replacedPage} was removed from Frame ${frameToReuse}, and Page ${pageNumber} was loaded into it.`;

    }

    // Refresh FIFO visualization.

    displayFIFO();

    return {
        frame: freeFrame,
        replacedPage: replacedPage
    };

}


/* STEP 13: DISPLAY PAGE TABLE */

function displayPageTable() {

    const tableBody = document.getElementById("pageTableBody");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    for (let page in pageTable) {

        const frame = pageTable[page];

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>Page ${page}</td>

            <td class="frame-number">
                ${frame === null ? "Not Available" : "Frame " + frame}
            </td>

            <td>
                ${
                    frame === null
                    ? '<span class="page-status unmapped">Not Mapped</span>'
                    : '<span class="page-status">Mapped</span>'
                }
            </td>
        `;

        tableBody.appendChild(row);

    }

}


/* STEP 14: DISPLAY TLB */

function displayTLB() {

    const tlbBody = document.getElementById("tlbTableBody");

    if (!tlbBody) return;

    tlbBody.innerHTML = "";

    tlb.forEach(entry => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>Page ${entry.page}</td>

            <td class="frame-number">
                Frame ${entry.frame}
            </td>

            <td>
                <span class="tlb-hit">Cached</span>
            </td>
        `;

        tlbBody.appendChild(row);

    });

    const hitsElement = document.getElementById("tlbHits");
    const missesElement = document.getElementById("tlbMisses");

    if (hitsElement) hitsElement.textContent = tlbHitCount;
    if (missesElement) missesElement.textContent = tlbMissCount;

}


/* STEP 15: PHYSICAL MEMORY */

function displayPhysicalMemory() {

    const frames = Array(TOTAL_FRAMES).fill(null);

    for (let page in pageTable) {

        const frame = pageTable[page];

        if (frame !== null && frame !== undefined) {
            frames[frame] = page;
        }

    }

    frames.forEach((page, index) => {

        const frameElement = document.getElementById(`frame-${index}`);

        if (!frameElement) return;

        if (page !== null) {

            frameElement.className = "memory-frame occupied";

            frameElement.innerHTML = `
                <strong>
                    <i class="fa-solid fa-memory"></i>
                    Frame ${index}
                </strong>
                <span>Page ${page}</span>
                <span>Occupied</span>
            `;

        } else {

            frameElement.className = "memory-frame free";

            frameElement.innerHTML = `
                <strong>
                    <i class="fa-regular fa-square"></i>
                    Frame ${index}
                </strong>
                <span>Available</span>
                <span>Free Memory</span>
            `;

        }

    });

}


/* STEP 16: UPDATE ALL STATISTICS */

function updateStatistics() {

    const totalElement = document.getElementById("totalTranslations");
    const hitsElement = document.getElementById("totalTlbHits");
    const faultsElement = document.getElementById("totalPageFaults");
    const framesElement = document.getElementById("totalFrames");

    const hitRatioElement = document.getElementById("tlbHitRatio");
    const faultRateElement = document.getElementById("pageFaultRate");

    if (totalElement) {
        totalElement.textContent = totalTranslations;
        animateCounter(totalElement);
    }

    if (hitsElement) {
        hitsElement.textContent = tlbHitCount;
        animateCounter(hitsElement);
    }

    if (faultsElement) {
        faultsElement.textContent = pageFaultCount;
        animateCounter(faultsElement);
    }

    const occupiedFrames = Object.values(pageTable)
        .filter(frame => frame !== null).length;

    if (framesElement) {
        framesElement.textContent =
            `${occupiedFrames}/${TOTAL_FRAMES}`;

        animateCounter(framesElement);
    }

    const hitRatio = totalTranslations === 0
        ? 0
        : (tlbHitCount / totalTranslations) * 100;

    const faultRate = totalTranslations === 0
        ? 0
        : (pageFaultCount / totalTranslations) * 100;

    if (hitRatioElement) {
        hitRatioElement.textContent =
            hitRatio.toFixed(1) + "%";

        animateCounter(hitRatioElement);
    }

    if (faultRateElement) {
        faultRateElement.textContent =
            faultRate.toFixed(1) + "%";

        animateCounter(faultRateElement);
    }

}


/* STEP 17: BINARY ADDRESS BREAKDOWN */

function getAddressBreakdown(
    virtualAddress,
    pageNumber,
    offset,
    frameNumber,
    physicalAddress
) {

    const totalPages = Object.keys(pageTable).length;

    const pageBits = Math.ceil(Math.log2(totalPages));
    const offsetBits = Math.log2(PAGE_SIZE);
    const totalBits = pageBits + offsetBits;

    const binaryAddress = virtualAddress
        .toString(2)
        .padStart(totalBits, "0");

    const pageBinary = binaryAddress.slice(0, pageBits);
    const offsetBinary = binaryAddress.slice(pageBits);

    // Physical address uses frame bits + offset bits.

    const frameBits = Math.ceil(Math.log2(TOTAL_FRAMES));
    const physicalBits = frameBits + offsetBits;

    const physicalBinary = physicalAddress
        .toString(2)
        .padStart(physicalBits, "0");

    return `

        <div class="address-breakdown">

            <h3>🔍 Virtual Address Breakdown</h3>

            <p>
                The virtual address is divided into
                Page Number and Offset.
            </p>

            <div class="binary-address">
                <span class="page-bits">${pageBinary}</span>
                <span class="offset-bits">${offsetBinary}</span>
            </div>

            <div class="bit-labels">
                <span>Page Number (${pageBits} bits)</span>
                <span>Offset (${offsetBits} bits)</span>
            </div>

            <div class="breakdown-details">

                <div>
                    <p>Virtual Address</p>
                    <h2>${virtualAddress}</h2>
                    <p>Binary: ${binaryAddress}</p>
                </div>

                <div>
                    <p>Page Number</p>
                    <h2>${pageNumber}</h2>
                    <p>Binary: ${pageBinary}</p>
                </div>

                <div>
                    <p>Offset</p>
                    <h2>${offset}</h2>
                    <p>Binary: ${offsetBinary}</p>
                </div>

                <div>
                    <p>Physical Frame</p>
                    <h2>${frameNumber}</h2>
                </div>

            </div>

            <h3>🧮 Physical Address Calculation</h3>

            <p>
                Physical Address =
                (Frame Number × Page Size) + Offset
            </p>

            <div class="calculation-box">

                <p>
                    (${frameNumber} × ${PAGE_SIZE}) + ${offset}
                </p>

                <h2>${physicalAddress}</h2>

                <p>
                    Physical Address in Binary: ${physicalBinary}
                </p>

            </div>

        </div>

    `;

}


/* STEP 18: RESET SIMULATOR */

function resetSimulator() {

    // Restore original page table.

    Object.keys(pageTable).forEach(page => {
        delete pageTable[page];
    });

    Object.assign(pageTable, initialPageTable);

    // Restore original FIFO queue.

    fifoQueue = ["0", "1", "3", "5", "6", "7"];

    fifoLastRemoved = null;
    fifoLastLoaded = null;

    fifoLastStatus = "Waiting for a page replacement...";

    // Reset TLB and statistics.

    tlb = [];

    tlbHitCount = 0;
    tlbMissCount = 0;
    totalTranslations = 0;
    pageFaultCount = 0;

    // Reset player progress.

    playerScore = 0;
    streak = 0;

    const scoreElement = document.getElementById("playerScore");
    const rankElement = document.getElementById("playerRank");
    const streakElement = document.getElementById("streakCount");

    if (scoreElement) scoreElement.textContent = "0 XP";
    if (rankElement) rankElement.textContent = "Memory Apprentice";
    if (streakElement) streakElement.textContent = "0";

    // Clear input.

    if (addressInput) {
        addressInput.value = "";
        addressInput.max = MAX_VIRTUAL_ADDRESS;
    }

    // Clear history.

    translationHistory = [];

    displayTranslationHistory();

    // Restore result message.

    if (resultArea) {
        resultArea.innerHTML = `
            <p>Translation Result</p>
            <h3>Waiting for input...</h3>
        `;
    }

    // Refresh all displays.

    displayPageTable();
    displayTLB();
    displayPhysicalMemory();
    displayFIFO();

    updateStatistics();

}


/* STEP 19: MAIN TRANSLATION FUNCTION */

function translateAddress() {

    if (!addressInput || !resultArea) return;

    const inputValue = addressInput.value.trim();
    const virtualAddress = Number(inputValue);

    // VALIDATE INPUT USING AUTOMATICALLY CALCULATED LIMIT.

    if (
        inputValue === "" ||
        !Number.isSafeInteger(virtualAddress) ||
        virtualAddress < 0 ||
        virtualAddress > MAX_VIRTUAL_ADDRESS
    ) {

        resultArea.innerHTML = `
            <p style="color:#fb923c;">INVALID INPUT</p>
            <h3>
                Enter an address between 0 and ${MAX_VIRTUAL_ADDRESS}.
            </h3>
        `;

        resetStreak();

        return;
    }

    const pageNumber = Math.floor(virtualAddress / PAGE_SIZE);
    const offset = virtualAddress % PAGE_SIZE;

    let tlbEntry = tlb.find(
        entry => entry.page === pageNumber
    );

    let frameNumber;
    let status;
    let allocationMessage = "";

    let allocatedFrame = null;
    let pageFaultOccurred = false;

    if (tlbEntry) {

        // TLB HIT.

        tlbHitCount++;

        frameNumber = tlbEntry.frame;

        status = "TLB HIT";

        updateScore(5);

    } else {

        // TLB MISS.

        tlbMissCount++;

        frameNumber = pageTable[pageNumber];

        status = "TLB MISS";

        if (frameNumber === null || frameNumber === undefined) {

            // PAGE FAULT.

            pageFaultCount++;

            pageFaultOccurred = true;

            const allocation = loadPageIntoMemory(pageNumber);

            frameNumber = allocation.frame;

            allocatedFrame = frameNumber;

            status = "PAGE FAULT - PAGE LOADED";

            allocationMessage =
                allocation.replacedPage === null
                ? `Page ${pageNumber} loaded into free Frame ${frameNumber}.`
                : `FIFO replaced Page ${allocation.replacedPage} with Page ${pageNumber} in Frame ${frameNumber}.`;

        }

        // ADD THE NEW TRANSLATION TO TLB.

        if (tlb.length >= TLB_SIZE) {
            tlb.shift();
        }

        tlb.push({
            page: pageNumber,
            frame: frameNumber
        });

    }

    const physicalAddress =
        frameNumber * PAGE_SIZE + offset;

    totalTranslations++;

    updateScore(10);
    updateStreak();

    // DISPLAY TRANSLATION RESULT.

    resultArea.innerHTML = `

        <p style="color:#4ade80;">
            ADDRESS TRANSLATION SUCCESSFUL
        </p>

        <h3>Virtual Address: ${virtualAddress}</h3>

        <br>

        <p style="color:#60a5fa;">${status}</p>

        ${allocationMessage ? `
            <p style="color:#fbbf24;">
                ${allocationMessage}
            </p>
        ` : ""}

        <br>

        <div style="
            display:grid;
            grid-template-columns:repeat(2,1fr);
            gap:12px;
        ">

            <div class="memory-frame">
                <p>Page Number</p>
                <h2>${pageNumber}</h2>
            </div>

            <div class="memory-frame">
                <p>Offset</p>
                <h2>${offset}</h2>
            </div>

            <div class="memory-frame">
                <p>Frame Number</p>
                <h2>${frameNumber}</h2>
            </div>

            <div class="memory-frame">
                <p>Physical Address</p>
                <h2 style="color:#4ade80;">
                    ${physicalAddress}
                </h2>
            </div>

        </div>

        <br>

        <p>
            Physical Address =
            (${frameNumber} × ${PAGE_SIZE}) + ${offset}
        </p>

        <h3 style="color:#4ade80;">
            = ${physicalAddress}
        </h3>

        ${getAddressBreakdown(
            virtualAddress,
            pageNumber,
            offset,
            frameNumber,
            physicalAddress
        )}

    `;

    // ADD HISTORY.

    addTranslationToHistory(
        virtualAddress,
        pageNumber,
        offset,
        frameNumber,
        physicalAddress,
        status
    );

    // REFRESH DASHBOARD.

    displayPageTable();
    displayTLB();
    displayPhysicalMemory();

    // UPDATE FIFO MESSAGE WHEN NO PAGE FAULT OCCURS.

    if (!pageFaultOccurred) {

        fifoLastStatus =
            `Page ${pageNumber} was already available in memory. No page replacement was required.`;

    }

    displayFIFO();

    updateStatistics();

    // TRIGGER ANIMATIONS.

    animateTLB(
        tlbEntry ? "TLB HIT" : "TLB MISS"
    );

    animateResult();

    if (pageFaultOccurred) {
        playAnimation(resultArea, "page-fault");
    }

    if (allocatedFrame !== null) {
        animateMemoryFrame(allocatedFrame);
    }

}


/* STEP 20: INITIALIZE WEBSITE */

displayPageTable();
displayTLB();
displayPhysicalMemory();
displayTranslationHistory();
displayFIFO();
updateStatistics();


/* STEP 21: BUTTON EVENTS */

if (translateButton) {
    translateButton.addEventListener("click", translateAddress);
}

if (resetButton) {
    resetButton.addEventListener("click", resetSimulator);
}

if (addressInput) {

    addressInput.addEventListener("keydown", function(event) {

        if (event.key === "Enter") {
            translateAddress();
        }

    });

}
