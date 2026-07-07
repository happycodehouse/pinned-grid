/**
 * 이미지(및 배경 이미지) 로드를 기다리는 프리로드 유틸
 */
const preloadImages = (selector = ".main-section img") => {
    return new Promise((resolve) => {
        imagesLoaded(document.querySelectorAll(selector), { background: true }, resolve);
    });
};

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
                toggleActions: "play none none reset",
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

    /**
     * ScrollTrigger, 관련 tween, 인라인 transform을 모두 정리
     * (rebuild 전 잔여 상태 제거)
     */
    teardown: function () {
        ScrollTrigger.getAll().forEach((st) => st.kill());
        gsap.killTweensOf([$mainInner, $mainTitle, $mainDesc, $gridList, ...$gridItems]);

        gsap.set([$mainInner, $mainTitle, $mainDesc, $gridList, ...$gridItems], {
            clearProps: "transform,opacity,pointerEvents",
        });
    },

    /**
     * 초기화 로직만 모아서 rebuild에서도 재사용
     */
    build: function () {
        this.initAbout();
        this.groupItemsByColumn();
        this.addParallaxOnScroll();
        this.animateTitleOnScroll();
        this.animateGridOnScroll();
        ScrollTrigger.refresh();
    },

    /**
     * 가로폭이 실제로 바뀌었을 때만 전체 재빌드
     */
    handleResize: function () {
        let prevWidth = window.innerWidth;
        let resizeTimeout;

        window.addEventListener("resize", () => {
            const currentWidth = window.innerWidth;

            // 모바일 주소창 show/hide로 인한 세로 높이 변화는 무시
            if (currentWidth === prevWidth) return;

            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                prevWidth = currentWidth;
                this.teardown();
                this.build();
            }, 250);
        });
    },

    init: function () {
        this.smoothScroll();
        this.build();
        this.handleResize();
    },
};

window.addEventListener("load", async () => {
    await preloadImages();
    Custom.utils.init();
});