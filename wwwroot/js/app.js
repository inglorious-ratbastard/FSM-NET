const cache = new Map();  

function runScripts(container) {
    container.querySelectorAll("script").forEach(oldScript => {
        const newScript = document.createElement("script");
        newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript);
        oldScript.remove();
    });
}

function updateActiveLinks() {
    document.querySelectorAll("a").forEach(link => {
        link.classList.toggle(
            "uk-active",
            link.pathname === location.pathname
        );
    });
}

async function navigate(url, push = true) {
    const app = document.querySelector("#app");
    app.style.opacity = "0.5";

    try {
        if (cache.has(url)) {
            app.innerHTML = cache.get(url);
            if (push) {
                history.pushState({ scroll: 0 }, "", url);
                window.scrollTo(0, 0);
            }
            runScripts(app);
            updateActiveLinks();
            if (window.UIkit) UIkit.update();
            return;
        }

        const res = await fetch(url, {
            headers: { "X-Requested-With": "XMLHttpRequest" }
        });

        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        const newContent = doc.querySelector("#app");
        if (!newContent) {
            window.location.href = url;
            return;
        }

        const newTitle = doc.querySelector("title");
        if (newTitle) document.title = newTitle.textContent;

        cache.set(url, newContent.innerHTML);
        app.innerHTML = newContent.innerHTML;

        if (push) {
            history.pushState({ scroll: 0 }, "", url);
            window.scrollTo(0, 0);
        }

        runScripts(app);
        updateActiveLinks();

        if (window.UIkit) UIkit.update();

    } catch {
        window.location.href = url;
    } finally {
        app.style.opacity = "1";
    }
}

document.addEventListener("click", e => {
    const link = e.target.closest("a");
    if (!link) return;

    const url = link.getAttribute("href");

    if (!url || url.startsWith("#") || link.hasAttribute("data-force")) return;

    const isExternal = new URL(link.href).origin !== location.origin;
    if (isExternal) return;

    e.preventDefault();
    navigate(url);
});

document.addEventListener("mouseover", e => {
    const link = e.target.closest("a");
    if (!link) return;

    const url = link.href;
    if (cache.has(url)) return;

    fetch(url, {
        headers: { "X-Requested-With": "XMLHttpRequest" }
    })
    .then(res => res.text())
    .then(html => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const content = doc.querySelector("#app");
        if (content) cache.set(url, content.innerHTML);
    });
});

document.addEventListener("submit", async e => {
    const form = e.target;
    if (!form.matches("form")) return;

    e.preventDefault();

    const res = await fetch(form.action || location.pathname, {
        method: form.method || "POST",
        body: new FormData(form)
    });

    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const content = doc.querySelector("#app");

    if (content) {
        document.querySelector("#app").innerHTML = content.innerHTML;
        runScripts(document.querySelector("#app"));
        updateActiveLinks();
        if (window.UIkit) UIkit.update();
    }
});

window.addEventListener("popstate", e => {
    navigate(location.pathname, false);
    if (e.state?.scroll !== undefined) {
        window.scrollTo(0, e.state.scroll);
    }
});
