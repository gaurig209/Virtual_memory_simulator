Virtual Memory & Address Translation Simulator

An interactive web-based simulator that demonstrates how an operating system and CPU translate virtual memory addresses into physical memory addresses. Enter any virtual address and watch the step-by-step lookup process unfold in real time.

🚀 Features

Live Address Translation: Input a virtual address to see it split into its Virtual Page Number (VPN) and Page Offset, then mapped to a Physical Frame Number (PFN).
TLB Simulation: Tracks and displays TLB Hits and TLB Misses to show how hardware caching speeds up memory access.
Page Table Lookups: Visualizes how the system traverses the page table when a TLB miss occurs.
Page Fault Handling: Detects and highlights Page Faults when a requested page is not currently loaded in physical memory.

🧠 Computer Organization & Architecture (COA) Concepts Covered

* Memory Hierarchy: Demonstrates the speed and interaction between the TLB (cache), Main Memory (RAM), and secondary storage.
* Address Translation: Shows the exact bitwise/mathematical conversion from logical (virtual) to physical addresses.
* Paging: Illustrates fixed-size memory blocks (pages and frames) and how they prevent external fragmentation.
* Translation Lookaside Buffer (TLB): Models associative cache behavior for recent page-to-frame translations.

🛠️ Built With

* HTML5 – Structure and interactive simulator interface
* CSS3 – Layout, memory table styling, and visual highlights
* JavaScript (ES6) – Address translation logic, TLB/Page Table simulation, and DOM updates

💻 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/gaurig209/Virtual_memory_simulator.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Virtual_memory_simulator
   ```
3. Run the simulator:
   * Using VS Code: Open the folder in VS Code, right-click `index.html`, and select **Open with Live Server**.
   * Using a Browser: Double-click `index.html` directly to open it in Chrome, Edge, or any modern web browser.

Author: 1. Gauri Giri (MCA): 2600520140022
        2. Shreya Singh (MCA): 2600520140062
COA Project
