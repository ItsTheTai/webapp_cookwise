function initializeThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle");

    if (!themeToggle) return;

    // Restore saved theme
    const savedTheme = localStorage.getItem("theme") || "dark";

    document.documentElement.setAttribute(
        "data-theme",
        savedTheme
    );

    themeToggle.addEventListener("click", () => {
        const currentTheme =
            document.documentElement.getAttribute("data-theme");

        const newTheme =
            currentTheme === "dark"
                ? "light"
                : "dark";

        document.documentElement.setAttribute(
            "data-theme",
            newTheme
        );

        localStorage.setItem("theme", newTheme);

        console.log("Theme changed:", newTheme);
    });
}