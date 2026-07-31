/**
 * Optional hangar 3D flourish (GAME_DESIGN §6).
 * - Feature-detects WebGL before doing anything
 * - Lazy-loads Three.js only when hangar is opened and WebGL is available
 * - Displays the real Morrowlit art as a textured 3D hangar prop (not toy geometry)
 * - Silent fallback: static ship art stays if WebGL / CDN / texture fails
 *
 * Purely additive — no trading/galaxy/story dependencies.
 *
 * Note: volumetric mesh is deferred. Owner will supply assets/ships/morrowlit.glb;
 * then switch this module to GLTFLoader (see TODO.md “Stage 10 hangar — true 3D mesh”).
 * Interim: assets/ships/morrowlit-3d.png (cutout of ship art) as a lit textured card.
 */
(function (global) {
  var THREE_URL = "https://unpkg.com/three@0.160.1/build/three.min.js";
  /** Transparent cutout of the game's Morrowlit hero art */
  var SHIP_TEXTURE_URL = "assets/ships/morrowlit-3d.png";

  var loadPromise = null;
  var runtime = null;
  var failed = false;

  function supportsWebGL() {
    try {
      var canvas = document.createElement("canvas");
      var gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  function prefersReducedMotion() {
    try {
      return (
        global.matchMedia &&
        global.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    } catch (e) {
      return false;
    }
  }

  function loadThree() {
    if (global.THREE) return Promise.resolve(global.THREE);
    if (loadPromise) return loadPromise;

    loadPromise = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = THREE_URL;
      s.async = true;
      s.onload = function () {
        if (global.THREE) resolve(global.THREE);
        else reject(new Error("THREE missing after load"));
      };
      s.onerror = function () {
        reject(new Error("Three.js failed to load"));
      };
      document.head.appendChild(s);
    }).catch(function (err) {
      loadPromise = null;
      throw err;
    });

    return loadPromise;
  }

  function loadTexture(THREE, url) {
    return new Promise(function (resolve, reject) {
      var loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(
        url,
        function (tex) {
          if ("colorSpace" in tex && THREE.SRGBColorSpace) {
            tex.colorSpace = THREE.SRGBColorSpace;
          } else if (tex.encoding !== undefined && THREE.sRGBEncoding) {
            tex.encoding = THREE.sRGBEncoding;
          }
          tex.anisotropy = 8;
          tex.needsUpdate = true;
          resolve(tex);
        },
        undefined,
        function () {
          reject(new Error("Ship texture failed: " + url));
        }
      );
    });
  }

  /**
   * Hangar prop built from the real ship painting (alpha cutout).
   * Gentle yaw stays within a range so the illustration never goes edge-on.
   */
  function buildShipFromArt(THREE, texture) {
    var group = new THREE.Group();

    var img = texture.image;
    var aspect =
      img && img.width && img.height ? img.width / img.height : 16 / 9;
    var height = 2.35;
    var width = height * aspect;

    var mat = new THREE.MeshStandardMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.12,
      metalness: 0.12,
      roughness: 0.72,
      side: THREE.DoubleSide,
      depthWrite: true,
    });

    // Primary art card — this IS the Morrowlit illustration
    var card = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    group.add(card);

    // Thin dark backplane so the card reads as a physical hangar display
    var back = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 1.01, height * 1.01),
      new THREE.MeshStandardMaterial({
        color: 0x0a1018,
        metalness: 0.4,
        roughness: 0.85,
        side: THREE.DoubleSide,
      })
    );
    back.position.z = -0.03;
    group.add(back);

    // Soft under-glow “pad light” (not geometry pretending to be thrusters)
    var glow = new THREE.Mesh(
      new THREE.CircleGeometry(Math.min(width, height) * 0.42, 32),
      new THREE.MeshBasicMaterial({
        color: 0x1a3a48,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -height * 0.48;
    group.add(glow);

    group.position.y = 0.08;
    return group;
  }

  function disposeRuntime() {
    if (!runtime) return;
    if (runtime.animId != null) {
      cancelAnimationFrame(runtime.animId);
      runtime.animId = null;
    }
    if (runtime.onResize) {
      global.removeEventListener("resize", runtime.onResize);
    }
    try {
      if (runtime.texture && runtime.texture.dispose) runtime.texture.dispose();
      if (runtime.renderer) {
        runtime.renderer.dispose();
        if (runtime.renderer.domElement && runtime.renderer.domElement.parentNode) {
          runtime.renderer.domElement.parentNode.removeChild(
            runtime.renderer.domElement
          );
        }
      }
    } catch (e) {
      /* ignore dispose errors */
    }
    if (runtime.hero) runtime.hero.classList.remove("is-3d");
    runtime = null;
  }

  function startScene(THREE, host, hero, texture) {
    disposeRuntime();

    var width = host.clientWidth || (hero && hero.clientWidth) || 640;
    var height = host.clientHeight || Math.max(180, Math.round(width * 0.5));

    var renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    if (renderer.outputColorSpace !== undefined && THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    host.innerHTML = "";
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 5.4);
    camera.lookAt(0, 0.05, 0);

    // Studio-style hangar lighting so the painted ship reads cleanly
    scene.add(new THREE.AmbientLight(0xb0c0d8, 0.75));
    var key = new THREE.DirectionalLight(0xfff0e0, 0.95);
    key.position.set(3, 4, 5);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x60d0c8, 0.35);
    fill.position.set(-4, 1, 2);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0xff8a40, 0.4);
    rim.position.set(-2, 1, -4);
    scene.add(rim);

    var ship = buildShipFromArt(THREE, texture);
    scene.add(ship);

    var paused = false;
    var t = 0;
    function frame() {
      runtime.animId = requestAnimationFrame(frame);
      if (paused) return;
      t += 0.012;
      // Sway only — never full spin (painted art must stay readable)
      ship.rotation.y = Math.sin(t * 0.55) * 0.38;
      ship.rotation.x = Math.sin(t * 0.4) * 0.04;
      ship.position.y = 0.08 + Math.sin(t * 0.7) * 0.04;
      renderer.render(scene, camera);
    }

    function onResize() {
      if (!runtime || !host) return;
      var w = host.clientWidth || width;
      var h = host.clientHeight || height;
      if (w < 2 || h < 2) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }

    runtime = {
      renderer: renderer,
      scene: scene,
      camera: camera,
      ship: ship,
      texture: texture,
      animId: null,
      host: host,
      hero: hero,
      onResize: onResize,
      setPaused: function (p) {
        paused = !!p;
      },
    };

    global.addEventListener("resize", onResize);
    if (hero) hero.classList.add("is-3d");
    frame();
  }

  /**
   * Try to mount the flourish. Never throws; never required for gameplay.
   */
  function tryActivate(host, hero) {
    if (failed) return Promise.resolve({ ok: false, reason: "failed" });
    if (!host) return Promise.resolve({ ok: false, reason: "no-host" });
    if (!supportsWebGL()) return Promise.resolve({ ok: false, reason: "no-webgl" });
    if (prefersReducedMotion()) {
      return Promise.resolve({ ok: false, reason: "reduced-motion" });
    }

    // Resume existing scene on same host
    if (runtime && runtime.host === host) {
      runtime.setPaused(false);
      if (hero) hero.classList.add("is-3d");
      return Promise.resolve({ ok: true, reason: "resumed" });
    }

    return loadThree()
      .then(function (THREE) {
        return loadTexture(THREE, SHIP_TEXTURE_URL).then(function (tex) {
          startScene(THREE, host, hero || host.parentElement, tex);
          return { ok: true };
        });
      })
      .catch(function () {
        failed = true;
        disposeRuntime();
        if (hero) hero.classList.remove("is-3d");
        return { ok: false, reason: "load-or-init-failed" };
      });
  }

  function pause() {
    if (runtime && runtime.setPaused) runtime.setPaused(true);
  }

  function resume() {
    if (runtime && runtime.setPaused) runtime.setPaused(false);
  }

  function deactivate() {
    disposeRuntime();
  }

  global.Ship3D = {
    supportsWebGL: supportsWebGL,
    tryActivate: tryActivate,
    pause: pause,
    resume: resume,
    deactivate: deactivate,
  };
})(window);
