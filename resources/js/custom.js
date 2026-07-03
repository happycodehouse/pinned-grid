const preloadImages = (selector = ".main-section img") => {
    return new Promise((resolve) => {
        imagesLoaded(document.querySelectorAll(selector), { background: true }, resolve)
    })
}

gsap.registerPlugin(ScrollTrigger);

const $mainSection = document.querySelector(".main-section");
const $mainInner = document.querySelector(".main-section .inner");
const $mainAbout = document.querySelector(".main-section .about");
const $mainTitle = document.querySelector(".main-section .about-title");
const $mainDesc = document.querySelector(".main-section .about-desc");
const $gridList = document.querySelector(".main-section .grid-list");
const $gridItems = document.querySelectorAll(".main-section .grid-item");

const NUM_COLUMNS = 3;
let titleOffsetY = 0;
let columns = [];

const Custom = {};

Custom.utils = {
    /**
     * 이미지를 미리 디코딩해서 첫 스크롤 시 버벅임 방지
     */
    preloadImages: function (selector = ".main-section img") {
        const images = document.querySelectorAll(selector);
        const promises = Array.from(images).map((img) =>
            img.decode ? img.decode().catch(() => {}) : Promise.resolve()
        );
        return Promise.all(promises);
    },

    smoothScroll: function () {
        const lenis = new Lenis({
            lerp: 0.08,
            wheelMultiplier: 1.4,
        });
        lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    },

    initAbout: function () {
        if ($mainDesc) {
            gsap.set($mainDesc, { opacity: 0, pointerEvents: "none" });
        }

        if ($mainAbout && $mainTitle) {
            const deltaY = ($mainAbout.offsetHeight - $mainTitle.offsetHeight) / 2;
            titleOffsetY = (deltaY / $mainAbout.offsetHeight) * 100;
            gsap.set($mainTitle, { yPercent: titleOffsetY });
        }
    },

    groupItemsByColumn: function () {
        columns = Array.from({ length: NUM_COLUMNS }, () => []);

        $gridItems.forEach((item, index) => {
            columns[index % NUM_COLUMNS].push(item);
        });
    },

    addParallaxOnScroll: function () {
        if (!$mainSection || !$mainInner) return;

        gsap.from($mainInner, {
            yPercent: -100,
            ease: "none",
            scrollTrigger: {
                trigger: $mainSection,
                start: "top bottom",
                end: "top top",
                scrub: true,
            },
        });
    },

    animateTitleOnScroll: function () {
        if (!$mainSection || !$mainTitle) return;

        gsap.from($mainTitle, {
            opacity: 0,
            duration: 0.7,
            ease: "power1.out",
            scrollTrigger: {
                trigger: $mainSection,
                start: "top 57%",
                toggleActions: "play none none reset"
            },
        });
    },

    gridRevealTimeline: function (cols = columns) {
        const timeline = gsap.timeline();

        const wh = window.innerHeight;
        const dy = wh - (wh - $gridList.offsetHeight) / 2;

        cols.forEach((column, colIndex) => {
            const fromTop = colIndex % 2 === 0;

            timeline.from(
                column,
                {
                    y: dy * (fromTop ? -1 : 1),
                    stagger: {
                        each: 0.06,
                        from: fromTop ? "end" : "start",
                    },
                    ease: "power1.inOut",
                },
                "grid-reveal"
            );
        });

        return timeline;
    },

    gridZoomTimeline: function (cols = columns) {
        const timeline = gsap.timeline({ defaults: { duration: 1, ease: "power3.inOut" } });

        timeline.to($gridList, { scale: 2.05 });

        timeline.to(cols[0], { xPercent: -40 }, "<");
        timeline.to(cols[2], { xPercent: 40 }, "<");

        timeline.to(
            cols[1],
            {
                yPercent: (index) => (index < Math.floor(cols[1].length / 2) ? -1 : 1) * 40,
                duration: 0.5,
                ease: "power1.inOut",
            },
            "-=0.5"
        );

        return timeline;
    },

    toggleContent: function (isVisible = true) {
        if (!$mainTitle || !$mainDesc) return;

        gsap.timeline({ defaults: { overwrite: true } })
            .to($mainTitle, {
                yPercent: isVisible ? 0 : titleOffsetY,
                duration: 0.7,
                ease: "power2.inOut",
            })
            .to(
                $mainDesc,
                {
                    opacity: isVisible ? 1 : 0,
                    duration: 0.4,
                    ease: `power1.${isVisible ? "inOut" : "out"}`,
                    pointerEvents: isVisible ? "all" : "none",
                },
                isVisible ? "-=90%" : "<"
            );
    },

    animateGridOnScroll: function () {
        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: $mainSection,
                start: "top 25%",
                end: "bottom bottom",
                scrub: true,
            },
        });

        timeline
            .add(this.gridRevealTimeline())
            .add(this.gridZoomTimeline(), "-=0.6")
            .add(() => this.toggleContent(timeline.scrollTrigger.direction === 1), "-=0.32");
    },

    init: function () {
        this.smoothScroll();
        this.initAbout();
        this.groupItemsByColumn();
        this.addParallaxOnScroll();
        this.animateTitleOnScroll();
        this.animateGridOnScroll();

        // 레이아웃이 이미지 로드 이후 확정되므로 한 번 더 재계산
        ScrollTrigger.refresh();
    },
};

window.addEventListener("load", async () => {
    await Custom.utils.preloadImages();
    Custom.utils.init();
});