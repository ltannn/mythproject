function initWorld3D(playerData) {
  'use strict';

  // ============================================================
  // RENDERER + SCENE + CAMERA
  // ============================================================
  var canvas = document.getElementById('world3d-c');
  var REN = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  REN.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  REN.setSize(window.innerWidth, window.innerHeight);
  REN.shadowMap.enabled = true;
  REN.shadowMap.type = THREE.PCFShadowMap;
  REN.shadowMap.autoUpdate = false;
  REN.toneMapping = THREE.ACESFilmicToneMapping;
  REN.toneMappingExposure = 1.25;
  REN.outputEncoding = THREE.sRGBEncoding;

  var SCN = new THREE.Scene();
  SCN.fog = new THREE.FogExp2(0x87ceeb, 0.003);
  SCN.background = new THREE.Color(0x87ceeb);

  var CAM = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 650);
  CAM.rotation.order = 'YXZ';

  // ============================================================
  // LIGHTS
  // ============================================================
  var ambL = new THREE.AmbientLight(0xfff2e0, 0.9);
  SCN.add(ambL);

  var sunL = new THREE.DirectionalLight(0xfff5dd, 2.2);
  sunL.position.set(80, 160, 60);
  sunL.castShadow = true;
  sunL.shadow.mapSize.width = 1024;
  sunL.shadow.mapSize.height = 1024;
  sunL.shadow.camera.near = 1;
  sunL.shadow.camera.far = 500;
  sunL.shadow.camera.left = -200;
  sunL.shadow.camera.right = 200;
  sunL.shadow.camera.top = 200;
  sunL.shadow.camera.bottom = -200;
  sunL.shadow.bias = -0.0005;
  sunL.shadow.normalBias = 0.02;
  SCN.add(sunL);

  // Warm fill light from opposite side
  var fillL = new THREE.DirectionalLight(0xc8deff, 0.6);
  fillL.position.set(-100, 80, -80);
  SCN.add(fillL);

  // Ground bounce light
  var bounceL = new THREE.DirectionalLight(0xaaddaa, 0.25);
  bounceL.position.set(0, -10, 0);
  SCN.add(bounceL);

  SCN.add(new THREE.HemisphereLight(0x88bbff, 0x44aa44, 0.6));

  // ============================================================
  // MATERIAL FACTORY
  // ============================================================
  // Procedural texture generator - creates canvas textures for PBR
  function makeTex(w, h, fn) {
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var c = cv.getContext('2d');
    fn(c, w, h);
    var t = new THREE.CanvasTexture(cv);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }

  // Brick texture
  var brickTex = makeTex(256, 256, function(c, w, h) {
    c.fillStyle = '#c8a87a'; c.fillRect(0,0,w,h);
    c.fillStyle = '#b89060';
    var bh = 28, bw = 60;
    for (var row = 0; row < h/bh+1; row++) {
      var ox = (row%2===0)?0:bw/2;
      for (var col = -1; col < w/bw+1; col++) {
        var bx = col*bw+ox, by = row*bh;
        // Color variation
        var v = (Math.sin(bx*0.3+by*0.7)*0.1);
        c.fillStyle = 'hsl('+(28+v*10)+','+(45+v*8)+'%,'+(48+v*6)+'%)';
        c.fillRect(bx+1, by+1, bw-3, bh-3);
      }
    }
    // Mortar lines (grout)
    c.strokeStyle = '#a09080'; c.lineWidth = 2;
    for (var row2 = 0; row2 < h/bh+1; row2++) {
      var ox2 = (row2%2===0)?0:bw/2;
      for (var col2 = -1; col2 < w/bw+1; col2++) {
        var bx2 = col2*bw+ox2, by2 = row2*bh;
        c.strokeRect(bx2+0.5, by2+0.5, bw-1, bh-1);
      }
    }
    // Noise/grit
    for (var n = 0; n < 800; n++) {
      var nx=Math.random()*w, ny=Math.random()*h, a=Math.random()*0.12;
      c.fillStyle='rgba(0,0,0,'+a+')'; c.fillRect(nx,ny,2,2);
    }
  });
  brickTex.repeat.set(4, 2);

  // Concrete texture
  var concTex = makeTex(256, 256, function(c, w, h) {
    c.fillStyle = '#b8b4aa'; c.fillRect(0,0,w,h);
    for (var i=0;i<2000;i++) {
      var x=Math.random()*w,y=Math.random()*h;
      var g=Math.random()*0.18;
      c.fillStyle='rgba('+(g>0.09?0:255)+','+(g>0.09?0:255)+','+(g>0.09?0:255)+','+Math.abs(g-0.09)+')';
      c.fillRect(x,y,Math.random()*3+1,Math.random()*2+1);
    }
  });
  concTex.repeat.set(3, 2);

  // Roof tile texture
  var roofTex = makeTex(256, 256, function(c, w, h) {
    c.fillStyle = '#a84830'; c.fillRect(0,0,w,h);
    var tw=32,th=16;
    for (var row=0;row<h/th+1;row++) {
      for (var col=0;col<w/tw+1;col++) {
        var tx=col*tw, ty=row*th;
        var v=Math.random()*0.15;
        c.fillStyle='hsl('+(10+v*20)+','+(65+v*10)+'%,'+(35+v*10)+'%)';
        c.fillRect(tx+0.5,ty+0.5,tw-2,th-2);
        c.fillStyle='rgba(0,0,0,0.2)';
        c.fillRect(tx,ty+th-2,tw,2);
      }
    }
    for (var n=0;n<600;n++) {
      c.fillStyle='rgba(0,0,0,'+Math.random()*0.1+')';
      c.fillRect(Math.random()*w,Math.random()*h,2,2);
    }
  });
  roofTex.repeat.set(6, 4);

  // Asphalt texture
  var asphaltTex = makeTex(256, 256, function(c, w, h) {
    c.fillStyle = '#555550'; c.fillRect(0,0,w,h);
    for (var i=0;i<3000;i++) {
      var x=Math.random()*w,y=Math.random()*h;
      var b=Math.floor(Math.random()*40+40);
      c.fillStyle='rgb('+b+','+b+','+(b-5)+')';
      c.fillRect(x,y,Math.random()*4+1,Math.random()*3+1);
    }
  });
  asphaltTex.repeat.set(8, 8);

  // Grass texture
  var grassTex = makeTex(256, 256, function(c, w, h) {
    c.fillStyle = '#5a9e42'; c.fillRect(0,0,w,h);
    // Grass blades variation
    for (var i=0;i<3000;i++) {
      var x=Math.random()*w,y=Math.random()*h;
      var g=Math.random();
      c.fillStyle='hsl('+(100+g*30)+','+(55+g*20)+'%,'+(32+g*18)+'%)';
      c.fillRect(x,y,1,Math.random()*4+2);
    }
    // Subtle grid variation for mowing effect
    for (var row=0;row<h/20;row++) {
      if(row%2===0) {
        c.fillStyle='rgba(0,0,0,0.04)';
        c.fillRect(0,row*20,w,20);
      }
    }
  });
  grassTex.repeat.set(32, 32);

  // Wood floor texture
  var woodTex = makeTex(256, 256, function(c, w, h) {
    var pw = 32;
    for (var col=0; col<w/pw; col++) {
      var hue = 28+col*2;
      c.fillStyle='hsl('+hue+',50%,48%)';
      c.fillRect(col*pw, 0, pw, h);
      // Wood grain lines
      for (var g=0;g<8;g++) {
        var gy=Math.random()*h;
        c.strokeStyle='rgba(0,0,0,0.08)'; c.lineWidth=Math.random()*2+0.5;
        c.beginPath(); c.moveTo(col*pw,gy);
        c.bezierCurveTo(col*pw+pw/2,gy+Math.random()*10-5,col*pw+pw/2,gy+Math.random()*10-5,col*pw+pw,gy+Math.random()*6-3);
        c.stroke();
      }
      c.strokeStyle='rgba(0,0,0,0.2)'; c.lineWidth=1;
      c.strokeRect(col*pw,0,pw,h);
    }
  });
  woodTex.repeat.set(2, 4);

  // Track surface texture
  var trackTex = makeTex(256, 256, function(c, w, h) {
    c.fillStyle = '#c05028'; c.fillRect(0,0,w,h);
    for (var i=0;i<2000;i++) {
      var x=Math.random()*w,y=Math.random()*h;
      var v=Math.random()*0.12;
      c.fillStyle='rgba(0,0,0,'+v+')'; c.fillRect(x,y,2,2);
    }
    // Lane texture pattern
    for (var row=0;row<h/4;row++) {
      if(row%2===0) { c.fillStyle='rgba(255,255,255,0.03)'; c.fillRect(0,row*4,w,2); }
    }
  });
  trackTex.repeat.set(4, 4);

  // Dirt infield texture
  var dirtTex = makeTex(256, 256, function(c, w, h) {
    c.fillStyle = '#b08040'; c.fillRect(0,0,w,h);
    for (var i=0;i<3000;i++) {
      var x=Math.random()*w,y=Math.random()*h;
      var v=Math.random();
      c.fillStyle='hsl('+(30+v*15)+','+(40+v*20)+'%,'+(35+v*20)+'%)';
      c.fillRect(x,y,Math.random()*4+1,Math.random()*4+1);
    }
  });
  dirtTex.repeat.set(3, 3);

  // Metal/pole texture
  var metalTex = makeTex(64, 256, function(c, w, h) {
    var grad = c.createLinearGradient(0,0,w,0);
    grad.addColorStop(0,'#aaaaaa'); grad.addColorStop(0.3,'#eeeeee');
    grad.addColorStop(0.5,'#cccccc'); grad.addColorStop(0.7,'#eeeeee');
    grad.addColorStop(1,'#aaaaaa');
    c.fillStyle=grad; c.fillRect(0,0,w,h);
    for (var i=0;i<200;i++) {
      c.fillStyle='rgba(255,255,255,'+Math.random()*0.1+')';
      c.fillRect(Math.random()*w,Math.random()*h,1,Math.random()*8);
    }
  });
  metalTex.repeat.set(1, 4);

  // Window glass texture with reflections
  var glassTex = makeTex(128, 128, function(c, w, h) {
    var grad = c.createLinearGradient(0,0,w,h);
    grad.addColorStop(0,'rgba(200,230,255,0.9)');
    grad.addColorStop(0.3,'rgba(160,200,240,0.7)');
    grad.addColorStop(0.7,'rgba(180,220,255,0.75)');
    grad.addColorStop(1,'rgba(140,190,230,0.85)');
    c.fillStyle=grad; c.fillRect(0,0,w,h);
    // Reflection streak
    c.fillStyle='rgba(255,255,255,0.4)';
    c.beginPath(); c.moveTo(10,0); c.lineTo(40,0); c.lineTo(20,h); c.lineTo(0,h); c.closePath(); c.fill();
    c.fillStyle='rgba(255,255,255,0.15)';
    c.beginPath(); c.moveTo(50,0); c.lineTo(65,0); c.lineTo(50,h); c.lineTo(38,h); c.closePath(); c.fill();
    // Frame border
    c.strokeStyle='rgba(100,140,180,0.8)'; c.lineWidth=3;
    c.strokeRect(1.5,1.5,w-3,h-3);
    // Window pane dividers
    c.beginPath(); c.moveTo(w/2,0); c.lineTo(w/2,h); c.stroke();
    c.beginPath(); c.moveTo(0,h*0.4); c.lineTo(w,h*0.4); c.stroke();
  });

  // Parking lot lines texture
  var parkTex = makeTex(256, 256, function(c, w, h) {
    c.fillStyle = '#888880'; c.fillRect(0,0,w,h);
    for (var i=0;i<2000;i++) {
      var x=Math.random()*w,y=Math.random()*h,v=Math.random()*0.12;
      c.fillStyle='rgba(0,0,0,'+v+')'; c.fillRect(x,y,3,3);
    }
  });
  parkTex.repeat.set(4, 4);

  // Stucco wall texture (lighter buildings)
  var stuccoTex = makeTex(256, 256, function(c, w, h) {
    c.fillStyle = '#e8d8b8'; c.fillRect(0,0,w,h);
    for (var i=0;i<4000;i++) {
      var x=Math.random()*w,y=Math.random()*h,v=Math.random()*0.08;
      c.fillStyle='rgba(0,0,0,'+v+')';
      var s=Math.random()*3+1;
      c.beginPath(); c.arc(x,y,s,0,Math.PI*2); c.fill();
    }
    for (var i2=0;i2<1000;i2++) {
      c.fillStyle='rgba(255,255,255,'+Math.random()*0.06+')';
      c.fillRect(Math.random()*w,Math.random()*h,Math.random()*5+1,1);
    }
  });
  stuccoTex.repeat.set(3, 2);

  // Turf field texture
  var turfTex = makeTex(256, 256, function(c, w, h) {
    c.fillStyle = '#2a7a38'; c.fillRect(0,0,w,h);
    for (var i=0;i<5000;i++) {
      var x=Math.random()*w,y=Math.random()*h,g=Math.random();
      c.fillStyle='hsl('+(115+g*20)+','+(55+g*15)+'%,'+(22+g*16)+'%)';
      c.fillRect(x,y,1,Math.random()*3+1);
    }
    // Mowing stripes
    for (var row=0;row<h/12;row++) {
      if(row%2===0) { c.fillStyle='rgba(0,0,0,0.06)'; c.fillRect(0,row*12,w,12); }
    }
  });
  turfTex.repeat.set(16, 16);

  // Door wood texture
  var doorTex = makeTex(128, 256, function(c, w, h) {
    c.fillStyle = '#7a4e28'; c.fillRect(0,0,w,h);
    for (var g=0;g<20;g++) {
      c.strokeStyle='rgba(0,0,0,0.12)'; c.lineWidth=Math.random()*3+0.5;
      c.beginPath(); c.moveTo(0,g*h/20);
      c.bezierCurveTo(w/3,g*h/20+Math.random()*8-4,2*w/3,g*h/20+Math.random()*8-4,w,g*h/20+Math.random()*4-2);
      c.stroke();
    }
    // Door panels
    c.strokeStyle='rgba(0,0,0,0.3)'; c.lineWidth=2;
    c.strokeRect(8,8,w-16,h/2-12);
    c.strokeRect(8,h/2+4,w-16,h/2-12);
    // Handle
    c.fillStyle='rgba(200,170,50,0.9)'; c.beginPath(); c.arc(w-18,h/2,5,0,Math.PI*2); c.fill();
  });

  // Pool tile texture
  var poolTex = makeTex(128, 128, function(c, w, h) {
    var ts = 16;
    for (var row=0;row<h/ts;row++) {
      for (var col=0;col<w/ts;col++) {
        var light = (row+col)%2===0;
        c.fillStyle = light ? '#5ab0cc' : '#4898b8';
        c.fillRect(col*ts,row*ts,ts,ts);
        c.strokeStyle='rgba(255,255,255,0.5)'; c.lineWidth=1;
        c.strokeRect(col*ts+0.5,row*ts+0.5,ts-1,ts-1);
      }
    }
  });
  poolTex.repeat.set(4, 4);

  // Bleacher metal texture
  var bleachTex = makeTex(64, 64, function(c, w, h) {
    var grad = c.createLinearGradient(0,0,0,h);
    grad.addColorStop(0,'#aaaaaa'); grad.addColorStop(0.4,'#dddddd');
    grad.addColorStop(0.6,'#dddddd'); grad.addColorStop(1,'#888888');
    c.fillStyle=grad; c.fillRect(0,0,w,h);
    for (var i=0;i<50;i++) {
      c.fillStyle='rgba(255,255,255,'+Math.random()*0.15+')';
      c.fillRect(Math.random()*w,Math.random()*h,Math.random()*w,1);
    }
  });
  bleachTex.repeat.set(4, 1);

  function mk(col, rough, metal) {
    return new THREE.MeshStandardMaterial({
      color: col,
      roughness: (rough === undefined) ? 0.85 : rough,
      metalness: metal || 0
    });
  }
  var MT = {
    grass: new THREE.MeshStandardMaterial({ map: grassTex, color: 0x88cc66, roughness: 0.95 }),
    road: new THREE.MeshStandardMaterial({ map: asphaltTex, color: 0x888888, roughness: 0.95 }),
    rline: mk(0xf5e030, 0.6),
    roofR: new THREE.MeshStandardMaterial({ map: roofTex, color: 0xcc6644, roughness: 0.75 }),
    roofG: new THREE.MeshStandardMaterial({ map: roofTex, color: 0x506898, roughness: 0.75 }),
    roofC: new THREE.MeshStandardMaterial({ map: roofTex, color: 0xd08040, roughness: 0.75 }),
    roofT: new THREE.MeshStandardMaterial({ map: roofTex, color: 0x904828, roughness: 0.75 }),
    roof2: new THREE.MeshStandardMaterial({ map: roofTex, color: 0x5090a0, roughness: 0.75 }),
    roofP: new THREE.MeshStandardMaterial({ map: roofTex, color: 0xc078c0, roughness: 0.75 }),
    wA: new THREE.MeshStandardMaterial({ map: brickTex, color: 0xddc8a8, roughness: 0.85 }),
    wB: new THREE.MeshStandardMaterial({ map: stuccoTex, color: 0xf2e8d0, roughness: 0.88 }),
    wG: new THREE.MeshStandardMaterial({ map: stuccoTex, color: 0xd8d0e8, roughness: 0.85 }),
    wC: new THREE.MeshStandardMaterial({ map: stuccoTex, color: 0xf8e8c8, roughness: 0.82 }),
    win: new THREE.MeshStandardMaterial({ map: glassTex, color: 0xaaccee, roughness: 0.02, metalness: 0.15, transparent: true, opacity: 0.72, envMapIntensity: 1 }),
    track: new THREE.MeshStandardMaterial({ map: trackTex, color: 0xd06038, roughness: 0.9 }),
    trkI: new THREE.MeshStandardMaterial({ map: turfTex, color: 0x559944, roughness: 0.9 }),
    park: new THREE.MeshStandardMaterial({ map: parkTex, color: 0xb0b0a8, roughness: 0.95 }),
    pln: mk(0xffffff, 0.7),
    ten: new THREE.MeshStandardMaterial({ map: turfTex, color: 0x2a7a48, roughness: 0.9 }),
    tln: mk(0xffffff, 0.6),
    dirt: new THREE.MeshStandardMaterial({ map: dirtTex, color: 0xc09850, roughness: 0.95 }),
    base: mk(0xffffff, 0.7),
    mnd: new THREE.MeshStandardMaterial({ map: dirtTex, color: 0xaa8840, roughness: 0.95 }),
    trk: new THREE.MeshStandardMaterial({ color: 0x7a5530, roughness: 0.95 }),
    lf: new THREE.MeshStandardMaterial({ color: 0x2d7a30, roughness: 0.88 }),
    lf2: new THREE.MeshStandardMaterial({ color: 0x3a9a40, roughness: 0.88 }),
    path: new THREE.MeshStandardMaterial({ map: concTex, color: 0xd8cc98, roughness: 0.92 }),
    side: new THREE.MeshStandardMaterial({ map: concTex, color: 0xd0c8a0, roughness: 0.9 }),
    pool: new THREE.MeshStandardMaterial({ color: 0x1890d8, roughness: 0.0, metalness: 0.05, transparent: true, opacity: 0.80 }),
    ptl: new THREE.MeshStandardMaterial({ map: poolTex, color: 0x50a8c8, roughness: 0.65 }),
    scr: mk(0x111111, 0.95),
    fnc: new THREE.MeshStandardMaterial({ map: metalTex, color: 0xd0d0d0, roughness: 0.45, metalness: 0.6 }),
    pol: new THREE.MeshStandardMaterial({ map: metalTex, color: 0xe0e0e0, roughness: 0.35, metalness: 0.7 }),
    flg: mk(0xdd2222),
    bl: new THREE.MeshStandardMaterial({ map: bleachTex, color: 0x999999, roughness: 0.7, metalness: 0.2 }),
    blS: new THREE.MeshStandardMaterial({ color: 0x3355aa, roughness: 0.6 }),
    dr: new THREE.MeshStandardMaterial({ map: doorTex, color: 0x9a6840, roughness: 0.7 }),
    stt: new THREE.MeshStandardMaterial({ map: concTex, color: 0xd0c8b0, roughness: 0.88 }),
    con: new THREE.MeshStandardMaterial({ map: concTex, color: 0xc8c0b0, roughness: 0.88 }),
    fl: new THREE.MeshStandardMaterial({ map: woodTex, color: 0xddc898, roughness: 0.6 }),
    brd: mk(0x1a3a1a, 0.95),
    chk: mk(0xf0f0f0, 0.9),
    dsk: new THREE.MeshStandardMaterial({ map: woodTex, color: 0xd4a858, roughness: 0.65 }),
    chr: mk(0x3a5090, 0.7),
    gym: new THREE.MeshStandardMaterial({ map: woodTex, color: 0xe0b040, roughness: 0.5 }),
    cld: mk(0xffffff, 1.0),
    stp: new THREE.MeshStandardMaterial({ map: turfTex, color: 0x2e7040, roughness: 0.9 }),
    eG: new THREE.MeshStandardMaterial({ color: 0x001100, emissive: 0x00ff44, emissiveIntensity: 1.2 }),
    eY: new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffaa, emissiveIntensity: 1.5 }),
    eL: new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffee88, emissiveIntensity: 2.5 }),
  };

  // ============================================================
  // COLLISION SYSTEM
  // Every solid object calls solidBox() which both draws it AND
  // registers its AABB in the COLS array.
  // Surfaces (floors, stairs) go in SURFS for step-up logic.
  // ============================================================
  var COLS = []; // Array of THREE.Box3 - solid collision volumes
  var SURFS = []; // { box: THREE.Box3, topY: float }
  var DOORS = []; // { mesh, open, cx, cz }
  var NPCS = [];  // { x, z, radius, label, msg }
  var ZONES = []; // { box2d, name }

  // Register a Box3 collider (world space)
  function addCol(x, y, z, w, h, d) {
    var b = new THREE.Box3(
      new THREE.Vector3(x - w/2, y,     z - d/2),
      new THREE.Vector3(x + w/2, y + h, z + d/2)
    );
    COLS.push(b);
    return b;
  }

  // Register a walkable surface
  function addSurf(cx, cz, w, d, topY) {
    var b = new THREE.Box3(
      new THREE.Vector3(cx - w/2, topY - 0.5, cz - d/2),
      new THREE.Vector3(cx + w/2, topY + 0.1, cz + d/2)
    );
    SURFS.push({ box: b, topY: topY });
  }

  // Draw + register solid
  function solidBox(w, h, d, mat, x, y, z) {
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y + h/2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    SCN.add(mesh);
    addCol(x, y, z, w, h, d);
    return mesh;
  }

  // Draw visual only (no collision - used for thin decor, lines, etc.)
  // visBox objects never cast shadows (too many small meshes); large ones still receive.
  function visBox(w, h, d, mat, x, y, z, ns) {
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    if (!ns) { mesh.receiveShadow = true; }
    SCN.add(mesh);
    return mesh;
  }

  // Draw + register surface (walkable top)
  function surfBox(w, h, d, mat, x, y, z) {
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y + h/2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    SCN.add(mesh);
    // Only add as surface (not solid wall collision) - steps are walkable
    addSurf(x, z, w, d, y + h);
    return mesh;
  }

  // Cylinder helper
  function visCyl(rt, rb, h, seg, mat, x, y, z) {
    var mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    SCN.add(mesh);
    return mesh;
  }

  // Cone helper
  function visCone(r, h, seg, mat, x, y, z) {
    var mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat);
    mesh.position.set(x, y, z);
    SCN.add(mesh);
    return mesh;
  }

  // Sphere helper
  function visSph(r, mat, x, y, z) {
    var mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), mat);
    mesh.position.set(x, y, z);
    SCN.add(mesh);
    return mesh;
  }

  // Sprite label
  function mkLabel(text, scale) {
    var cv = document.createElement('canvas');
    cv.width = 512; cv.height = 72;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = 'rgba(8,15,40,0.97)';
    ctx.beginPath(); ctx.roundRect(3, 3, 506, 66, 9); ctx.fill();
    ctx.strokeStyle = 'rgba(232,208,112,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(3, 3, 506, 66, 9); ctx.stroke();
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#f0dc88';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 36);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: true }));
    sp.scale.set((scale || 12) * 0.5, 0.85, 1);
    SCN.add(sp);
    return sp;
  }

  // ============================================================
  // BUILDING FACTORY
  // Every piece registers its own collider.
  // ============================================================
  function building(x, z, w, d, h, wmat, rmat, name, floors, itype) {
    floors = floors || 2;

    // FLOOR slab (surface, not solid wall)
    surfBox(w - 0.6, 0.18, d - 0.6, MT.fl, x, 0, z);
    // Ceiling slab for each floor
    for (var cf = 1; cf <= floors; cf++) {
      visBox(w - 0.6, 0.15, d - 0.6, MT.con, x, (h / floors) * cf, z);
    }

    // EXTERIOR WALLS - each wall panel is a solid
    var doorW = 3.0;
    // Left wall
    solidBox(0.35, h, d, wmat, x - w/2 + 0.18, 0, z);
    // Right wall
    solidBox(0.35, h, d, wmat, x + w/2 - 0.18, 0, z);
    // Back wall
    solidBox(w, h, 0.35, wmat, x, 0, z - d/2 + 0.18);
    // Front left panel
    solidBox(w/2 - doorW/2 - 0.18, h, 0.35, wmat, x - (w/4 + doorW/4), 0, z + d/2 - 0.18);
    // Front right panel
    solidBox(w/2 - doorW/2 - 0.18, h, 0.35, wmat, x + (w/4 + doorW/4), 0, z + d/2 - 0.18);
    // Door header
    solidBox(doorW, h - 3.1, 0.35, wmat, x, 3.1, z + d/2 - 0.18);

    // ROOF
    solidBox(w + 0.6, 0.75, d + 0.6, rmat, x, h, z);

    // WINDOWS (visual only - glass)
    var fh = h / floors;
    for (var f = 0; f < floors; f++) {
      var fy = f * fh + fh * 0.52 + 0.5;
      for (var wx = x - w/2 + 2.8; wx < x + w/2 - 2; wx += 3.0) {
        visBox(1.1, 1.35, 0.12, MT.win, wx, fy, z + d/2 + 0.02);
        visBox(1.1, 1.35, 0.12, MT.win, wx, fy, z - d/2 - 0.02);
      }
      for (var wz = z - d/2 + 2.8; wz < z + d/2 - 2; wz += 3.0) {
        visBox(0.12, 1.35, 1.1, MT.win, x - w/2 - 0.02, fy, wz);
        visBox(0.12, 1.35, 1.1, MT.win, x + w/2 + 0.02, fy, wz);
      }
    }

    // DOOR (visual mesh, togglable, with collision box)
    var dm = new THREE.Mesh(new THREE.BoxGeometry(2.7, 3.1, 0.1), MT.dr);
    dm.position.set(x, 1.55, z + d/2 - 0.05);
    dm.castShadow = true; SCN.add(dm);
    var _dmMin = new THREE.Vector3(x - 1.35, 0, z + d/2 - 0.15);
    var _dmMax = new THREE.Vector3(x + 1.35, 3.15, z + d/2 + 0.15);
    var dmCol = new THREE.Box3(_dmMin.clone(), _dmMax.clone());
    DOORS.push({ mesh: dm, open: false, cx: x, cz: z + d/2 - 0.05,
                 col: dmCol, origMin: _dmMin.clone(), origMax: _dmMax.clone(), wallAxis: 'z' });

    // SIDE STAIRCASE (2-floor buildings)
    if (floors > 1) {
      for (var si = 0; si < 9; si++) {
        var stepY = si * 0.5;
        solidBox(3.5, 0.32, 0.82, MT.stt, x + w/2 + 2.2, stepY, z + d/2 - 0.4 - si * 0.82);
        addSurf(x + w/2 + 2.2, z + d/2 - 0.4 - si * 0.82, 3.5, 0.82, stepY + 0.32);
      }
      // Landing
      solidBox(3.5, 0.32, 3.0, MT.stt, x + w/2 + 2.2, 4.32, z + d/2 - 8.0);
      addSurf(x + w/2 + 2.2, z + d/2 - 8.0, 3.5, 3.0, 4.64);
      // 2nd floor walkway (solid so you can stand on it)
      solidBox(w + 2.0, 0.3, 2.8, MT.con, x, h/2, z + d/2 + 1.0);
      addSurf(x, z + d/2 + 1.0, w + 2.0, 2.8, h/2 + 0.3);
    }

    // INTERIOR
    buildInterior(x, z, w, d, h, floors, itype);

    // Label + NPC
    if (name) {
      var sp = mkLabel(name, 12);
      sp.position.set(x, h + 5.5, z);
      NPCS.push({ x: x, z: z, radius: 8, label: name, msg: name + ' - Press F to open the door. Use stairs to reach upper floors.' });
    }
  }

  // ============================================================
  // RICH INTERIOR SYSTEM
  // Each classroom gets a unique color palette, layout and decor
  // ============================================================
  var clsIndex = 0; // increments so each room is unique

  // Emissive ceiling light material
  var ceilLightMat = new THREE.MeshStandardMaterial({color:0xfff8e8, emissive:0xfff0cc, emissiveIntensity:1.2});

  // Classroom wall accent colors - one per classroom
  var accentColors = [
    0x2255cc, // deep blue
    0xcc3322, // red/maroon (MVHS!)
    0x228833, // forest green
    0xcc8800, // amber/gold (MVHS!)
    0x882299, // purple
    0x117788, // teal
    0xcc4422, // burnt orange
    0x336688, // slate blue
    0x559933, // lime green
    0x993333, // crimson
  ];

  function buildInterior(bx, bz, w, d, h, floors, type) {
    if (type === 'cls') {
      var idx = clsIndex++;
      var accent = accentColors[idx % accentColors.length];
      var accentMat = mk(accent, 0.8);
      var wallColor = (idx % 3 === 0) ? 0xf0ede4 : (idx % 3 === 1) ? 0xe8f0f8 : 0xf0f4e8;
      var wallMat2 = mk(wallColor, 0.92);
      var floorColor = (idx % 2 === 0) ? 0xddd0b8 : 0xd8e0d0;

      // Colored accent strip along front wall below board
      solidBox(w - 0.8, 0.8, 0.12, accentMat, bx, 0.4, bz - d/2 + 0.55);
      // Accent strip along bottom of side walls
      solidBox(0.12, 0.5, d - 0.8, accentMat, bx - w/2 + 0.55, 0.25, bz);
      solidBox(0.12, 0.5, d - 0.8, accentMat, bx + w/2 - 0.55, 0.25, bz);

      // Board - green chalkboard or white smartboard alternating
      var isSmart = (idx % 2 === 0);
      var boardMat = isSmart ? mk(0xfafafa, 0.3) : MT.brd;
      var writeMat = isSmart ? mk(0x2244cc, 0.6) : MT.chk;
      solidBox(w - 2.8, 2.3, 0.14, boardMat, bx, h/2 - 0.5, bz - d/2 + 0.55);
      visBox(w - 5.0, 1.3, 0.05, writeMat, bx, h/2 - 0.5, bz - d/2 + 0.63);

      // Board content texture (text lines or diagram)
      if (isSmart) {
        // Smartboard - colored boxes simulating slides
        var slideColors = [0x3366ff, 0xff4444, 0x22bb22];
        for (var si2 = 0; si2 < 3; si2++) {
          visBox((w-6)/3 - 0.3, 0.9, 0.04, mk(slideColors[si2], 0.5),
            bx - (w-6)/3 + si2*(w-6)/3, h/2 - 0.5, bz - d/2 + 0.62);
        }
      } else {
        // Chalk board with written lines
        for (var cl2 = 0; cl2 < 4; cl2++) {
          visBox(w - 7, 0.05, 0.04, mk(0xddddbb, 0.9), bx, h/2 - 0.8 + cl2*0.3, bz - d/2 + 0.62);
        }
      }

      // Board tray
      solidBox(w - 2.6, 0.06, 0.25, mk(0xaaaaaa, 0.6, 0.3), bx, h/2 - 1.7, bz - d/2 + 0.6);

      // Teacher's area - desk + podium
      solidBox(2.2, 0.82, 1.1, MT.dsk, bx - 2, 0, bz - d/2 + 2.6);
      // Podium
      solidBox(0.7, 1.1, 0.6, mk(0x886644, 0.7), bx + 2, 0, bz - d/2 + 2.4);
      visBox(0.72, 0.08, 0.62, mk(0x6644aa, 0.5), bx + 2, 1.1, bz - d/2 + 2.4);

      // Teacher monitor on desk
      solidBox(0.06, 0.5, 0.38, mk(0x111111, 0.3, 0.5), bx - 1.0, 0.82, bz - d/2 + 2.5);
      visBox(0.04, 0.42, 0.30, mk(0x112244, 0.1), bx - 0.97, 0.82, bz - d/2 + 2.5);

      // Student desks - vary layout by room
      var rowStart = bz - d/2 + 4.2;
      var rowEnd   = bz + d/2 - 2.2;
      var colStart = bx - w/2 + 2.0;
      var colEnd   = bx + w/2 - 2.0;
      var deskW = 1.15, deskD = 0.65;
      // Alternate desk colors per room
      var deskColors = [0xc8a858, 0xb8c8a0, 0xa8b8c8, 0xc8b8a0, 0xb0a8c0];
      var deskM = mk(deskColors[idx % deskColors.length], 0.7);
      var chairColors = [0x3355aa, 0xaa3322, 0x225533, 0x885522, 0x553388];
      var chairM = mk(chairColors[idx % chairColors.length], 0.6);

      for (var dr = rowStart; dr <= rowEnd; dr += 2.6) {
        for (var dc = colStart; dc <= colEnd; dc += 2.0) {
          // Desk surface
          solidBox(deskW, 0.07, deskD, deskM, dc, 0.76, dr);
          // Desk legs (4 corners, visual)
          visBox(0.06, 0.76, 0.06, mk(0x888888,0.5,0.3), dc - 0.45, 0.38, dr - 0.25);
          visBox(0.06, 0.76, 0.06, mk(0x888888,0.5,0.3), dc + 0.45, 0.38, dr - 0.25);
          visBox(0.06, 0.76, 0.06, mk(0x888888,0.5,0.3), dc - 0.45, 0.38, dr + 0.25);
          visBox(0.06, 0.76, 0.06, mk(0x888888,0.5,0.3), dc + 0.45, 0.38, dr + 0.25);
          // Chair seat
          solidBox(0.68, 0.07, 0.65, chairM, dc, 0.50, dr + 0.78);
          // Chair back
          solidBox(0.68, 0.52, 0.06, chairM, dc, 0.78, dr + 0.46);
          // Chair legs
          visBox(0.06, 0.50, 0.06, mk(0x888888,0.5,0.3), dc - 0.28, 0.25, dr + 0.50);
          visBox(0.06, 0.50, 0.06, mk(0x888888,0.5,0.3), dc + 0.28, 0.25, dr + 0.50);
          visBox(0.06, 0.50, 0.06, mk(0x888888,0.5,0.3), dc - 0.28, 0.25, dr + 1.06);
          visBox(0.06, 0.50, 0.06, mk(0x888888,0.5,0.3), dc + 0.28, 0.25, dr + 1.06);
          // Book/paper on desk (visual)
          if (Math.random() > 0.4) {
            visBox(0.5, 0.02, 0.38, mk(0xffffff, 0.9), dc + 0.1, 0.78, dr - 0.05);
          }
        }
      }

      // Bulletin board on side wall
      solidBox(0.1, 1.4, 2.8, mk(0xcc8833, 0.9), bx + w/2 - 0.6, 1.5, bz + 1.0);
      // Colorful papers pinned to it
      var pinColors2 = [0xff4444, 0x4444ff, 0xffcc00, 0x44aa44, 0xff8844, 0xaa44aa];
      for (var pi2 = 0; pi2 < 6; pi2++) {
        visBox(0.05, 0.55, 0.42, mk(pinColors2[pi2], 0.85),
          bx + w/2 - 0.55, 1.2 + (pi2 > 2 ? 0.65 : 0), bz - 0.6 + (pi2%3)*0.95);
      }

      // Clock on back wall
      visCyl(0.38, 0.38, 0.08, 16, mk(0xffffff, 0.5), bx, h - 0.8, bz + d/2 - 0.6);
      visCyl(0.36, 0.36, 0.04, 16, mk(0x111111, 0.95), bx, h - 0.76, bz + d/2 - 0.6);
      // Clock hands
      visBox(0.03, 0.04, 0.28, mk(0x111111, 0.9), bx, h - 0.75, bz + d/2 - 0.6);
      visBox(0.03, 0.04, 0.22, mk(0x333333, 0.9), bx + 0.12, h - 0.75, bz + d/2 - 0.62);

      // Ceiling lights - fluorescent strips
      for (var lx2 = bx - w/2 + 2.5; lx2 < bx + w/2 - 2; lx2 += 3.8) {
        visBox(0.35, 0.06, 2.2, ceilLightMat, lx2, h - 0.07, bz);
        // Light housing
        visBox(0.4, 0.09, 2.3, mk(0xcccccc, 0.5, 0.2), lx2, h - 0.04, bz);
      }

      // Backpack hooks on wall near door
      for (var hk = 0; hk < 5; hk++) {
        visBox(0.06, 0.06, 0.2, mk(0x888888, 0.4, 0.5), bx + w/2 - 0.6, 1.2, bz + d/2 - 2.5 - hk * 0.5);
      }

      // Colored pencil/supply caddy on teacher desk
      visCyl(0.14, 0.14, 0.28, 8, mk(accent, 0.7), bx - 0.6, 0.82, bz - d/2 + 2.4);

      // Calendar/whiteboard on side wall
      solidBox(0.1, 0.8, 1.2, mk(0xffffff, 0.5), bx - w/2 + 0.55, 1.5, bz - 1.5);

    } else if (type === 'locker') {
      // Tile floor
      var lkFloorMat = makeTex(128, 128, function(c2, w2, h2) {
        c2.fillStyle = '#c8c0b8'; c2.fillRect(0,0,w2,h2);
        c2.strokeStyle = '#a89890'; c2.lineWidth = 1.5;
        for (var lfi = 0; lfi < w2; lfi += 32) { c2.beginPath(); c2.moveTo(lfi,0); c2.lineTo(lfi,h2); c2.stroke(); }
        for (var lfj = 0; lfj < h2; lfj += 32) { c2.beginPath(); c2.moveTo(0,lfj); c2.lineTo(w2,lfj); c2.stroke(); }
      });
      var lkFloor = new THREE.Mesh(new THREE.BoxGeometry(w-0.8, 0.1, d-0.8), new THREE.MeshStandardMaterial({map:lkFloorMat,roughness:0.4,metalness:0.1}));
      lkFloor.position.set(bx, 0.1, bz); lkFloor.receiveShadow=true; SCN.add(lkFloor);
      addSurf(bx, bz, w-0.8, d-0.8, 0.1);
      // Lockers along back (north) wall and side walls
      var lkMat = mk(0x5577aa, 0.6, 0.4);
      var lkDoorMat = mk(0x3355aa, 0.55, 0.5);
      // Back wall lockers
      for (var lki = bx - w/2 + 1.2; lki < bx + w/2 - 0.8; lki += 1.0) {
        solidBox(0.85, 2.0, 0.55, lkMat, lki, 0, bz - d/2 + 0.55);
        visBox(0.75, 1.85, 0.04, lkDoorMat, lki, 0, bz - d/2 + 0.82);
        visBox(0.08, 0.08, 0.06, mk(0xdddddd, 0.3, 0.6), lki + 0.28, 0.96, bz - d/2 + 0.86);
      }
      // Left wall lockers
      for (var lkj = bz - d/2 + 1.2; lkj < bz + d/2 - 0.8; lkj += 1.0) {
        solidBox(0.55, 2.0, 0.85, lkMat, bx - w/2 + 0.55, 0, lkj);
        visBox(0.04, 1.85, 0.75, lkDoorMat, bx - w/2 + 0.82, 0, lkj);
        visBox(0.06, 0.08, 0.08, mk(0xdddddd, 0.3, 0.6), bx - w/2 + 0.86, 0.96, lkj + 0.28);
      }
      // Benches down the center
      for (var lkb = bz - d/2 + 2.5; lkb < bz + d/2 - 2; lkb += 4.5) {
        solidBox(w * 0.6, 0.06, 0.36, mk(0x8a6a3a, 0.7), bx, 0.46, lkb);
        solidBox(0.1, 0.46, 0.3, mk(0x555555,0.5), bx - w*0.25, 0, lkb);
        solidBox(0.1, 0.46, 0.3, mk(0x555555,0.5), bx + w*0.25, 0, lkb);
      }
      // Ceiling light strip
      visBox(w - 2, 0.08, 0.4, ceilLightMat, bx, h - 0.1, bz);

    } else if (type === 'gym') {
      // This is now handled by buildGym() separately - skip
      return;

    } else if (type === 'caf') {
      // Cafeteria floor - checkered tile texture
      var cafFloorMat = makeTex(256, 256, function(c2, w2, h2) {
        var ts2 = 32;
        for (var row2=0;row2<h2/ts2;row2++) {
          for (var col2=0;col2<w2/ts2;col2++) {
            c2.fillStyle = (row2+col2)%2===0 ? '#e8e4dc' : '#d0ccc4';
            c2.fillRect(col2*ts2,row2*ts2,ts2,ts2);
            c2.strokeStyle='rgba(0,0,0,0.08)'; c2.lineWidth=1;
            c2.strokeRect(col2*ts2+0.5,row2*ts2+0.5,ts2-1,ts2-1);
          }
        }
      });
      cafFloorMat.repeat.set(8, 6);
      visBox(w - 0.8, 0.06, d - 0.8, new THREE.MeshStandardMaterial({ map: cafFloorMat, roughness: 0.4, metalness: 0.05 }), bx, 0.12, bz);

      // Long tables with colored bench tops per section
      var tableColors2 = [mk(0xd4a844, 0.7), mk(0xb8c8a8, 0.7), mk(0xc8b8d8, 0.7)];
      var benchColors2 = [mk(0x3355aa, 0.6), mk(0x338844, 0.6), mk(0xaa3355, 0.6)];
      for (var tr2 = 0; tr2 < 4; tr2++) {
        var tmat = tableColors2[tr2 % 3];
        var bmat2 = benchColors2[tr2 % 3];
        for (var tc2 = -2; tc2 <= 2; tc2++) {
          // Table with legs
          solidBox(3.4, 0.09, 1.1, tmat, bx + tc2 * 4.2, 0.84, bz + tr2 * 4.0 - 5.5);
          visBox(0.08, 0.84, 0.08, mk(0x888888,0.5,0.4), bx+tc2*4.2-1.5, 0.42, bz+tr2*4.0-5.5-0.42);
          visBox(0.08, 0.84, 0.08, mk(0x888888,0.5,0.4), bx+tc2*4.2+1.5, 0.42, bz+tr2*4.0-5.5-0.42);
          visBox(0.08, 0.84, 0.08, mk(0x888888,0.5,0.4), bx+tc2*4.2-1.5, 0.42, bz+tr2*4.0-5.5+0.42);
          visBox(0.08, 0.84, 0.08, mk(0x888888,0.5,0.4), bx+tc2*4.2+1.5, 0.42, bz+tr2*4.0-5.5+0.42);
          // Bench seats
          solidBox(3.4, 0.09, 0.48, bmat2, bx + tc2 * 4.2, 0.52, bz + tr2 * 4.0 - 5.5 - 0.82);
          solidBox(3.4, 0.09, 0.48, bmat2, bx + tc2 * 4.2, 0.52, bz + tr2 * 4.0 - 5.5 + 0.82);
          // Food tray on some tables
          if ((tr2 + tc2) % 3 === 0) {
            visBox(0.6, 0.03, 0.44, mk(0xaa9966, 0.5), bx+tc2*4.2, 0.88, bz+tr2*4.0-5.5);
          }
        }
      }
      // Serving counter with sneeze guard
      solidBox(w - 4, 1.1, 1.6, mk(0xd0ccc0, 0.7), bx, 0, bz - d/2 + 1.5);
      solidBox(w - 4, 0.09, 1.6, mk(0xa0a0a8, 0.3, 0.4), bx, 1.1, bz - d/2 + 1.5);
      // Sneeze guard
      solidBox(w - 5, 0.6, 0.06, new THREE.MeshStandardMaterial({color:0x88ccee, transparent:true, opacity:0.4, roughness:0.05}), bx, 1.35, bz - d/2 + 1.8);
      // Food items on counter
      visCyl(0.25, 0.25, 0.4, 8, mk(0xcc4422, 0.6), bx - 6, 1.2, bz - d/2 + 1.4);
      visCyl(0.2, 0.2, 0.3, 8, mk(0xeebb44, 0.6), bx - 3, 1.2, bz - d/2 + 1.4);
      visCyl(0.22, 0.22, 0.35, 8, mk(0x44aa44, 0.6), bx, 1.2, bz - d/2 + 1.4);
      // Menu board - glowing
      solidBox(w - 6, 2.0, 0.12, MT.brd, bx, h - 1.4, bz - d/2 + 0.22);
      visBox(w - 8, 1.5, 0.04, MT.eG, bx, h - 1.4, bz - d/2 + 0.3);
      // Trash/recycle bins
      visCyl(0.4, 0.4, 0.9, 10, mk(0x446622, 0.8), bx + w/2 - 2, 0.45, bz + d/2 - 2);
      visCyl(0.4, 0.4, 0.9, 10, mk(0x224488, 0.8), bx + w/2 - 3.2, 0.45, bz + d/2 - 2);
      // Ceiling lights - large panels
      for (var cx2 = bx - w/2 + 4; cx2 < bx + w/2 - 3; cx2 += 6) {
        visBox(1.2, 0.08, 3.0, ceilLightMat, cx2, h - 0.06, bz);
        visBox(1.28, 0.1, 3.1, mk(0xcccccc, 0.5, 0.2), cx2, h - 0.03, bz);
      }

    } else if (type === 'lib') {
      // Library floor - warm wood
      visBox(w - 0.8, 0.06, d - 0.8, MT.fl, bx, 0.12, bz);
      // Bookshelves - rows of shelving units
      var shx2 = bx - w/2 + 2.0;
      var shelfColors2 = [0x8a6030, 0x7a5028, 0x9a7040, 0x6a4820];
      var bookHues = [0, 30, 60, 120, 180, 240, 280, 320];
      var sIdx2 = 0;
      while (shx2 < bx + w/2 - 1.5) {
        var shMat2 = mk(shelfColors2[sIdx2 % 4], 0.8);
        solidBox(0.38, 2.4, d - 3.8, shMat2, shx2, 0, bz);
        // Shelf boards
        for (var sh2 = 0; sh2 < 4; sh2++) {
          visBox(0.4, 0.06, d - 4.0, mk(shelfColors2[(sIdx2+1)%4], 0.85), shx2, 0.55 + sh2*0.6, bz);
        }
        // Books - colorful spines
        for (var bk2 = 0; bk2 < bookHues.length; bk2++) {
          var bw2 = 0.08 + Math.random()*0.06;
          visBox(0.09, 0.32 + Math.random()*0.18, bw2,
            new THREE.MeshStandardMaterial({ color:new THREE.Color().setHSL(bookHues[bk2]/360, 0.8, 0.45+Math.random()*0.2), roughness:0.85 }),
            shx2 + 0.22, 0.72 + (bk2%4)*0.6, bz - d/2 + 2.5 + bk2 * ((d-5)/8));
        }
        shx2 += 1.9; sIdx2++;
      }
      // Reading tables - round and rectangular
      visCyl(1.4, 1.4, 0.09, 16, mk(0xc0a060, 0.5), bx + w/4, 0.76, bz - 2);
      solidBox(4.0, 0.09, 1.5, mk(0xc0a060, 0.5), bx - w/4, 0.76, bz + 2);
      // Chairs at reading tables
      for (var rc2 = 0; rc2 < 4; rc2++) {
        var ang2 = rc2 * Math.PI / 2;
        solidBox(0.62, 0.07, 0.62, mk(0x445566, 0.7), bx + w/4 + Math.cos(ang2)*1.9, 0.48, bz - 2 + Math.sin(ang2)*1.9);
      }
      solidBox(0.62, 0.07, 0.62, mk(0x445566, 0.7), bx - w/4, 0.48, bz + 0.5);
      solidBox(0.62, 0.07, 0.62, mk(0x445566, 0.7), bx - w/4, 0.48, bz + 3.5);
      // Computer stations
      for (var cs2 = 0; cs2 < 3; cs2++) {
        solidBox(1.2, 0.82, 0.7, mk(0xcccccc, 0.5), bx - w/2 + 1.5, 0, bz - 3 + cs2 * 2.5);
        solidBox(0.06, 0.42, 0.32, mk(0x111111, 0.3, 0.5), bx - w/2 + 1.5, 0.82, bz - 3 + cs2 * 2.5);
        visBox(0.04, 0.36, 0.26, mk(0x002244, 0.1), bx - w/2 + 1.47, 0.82, bz - 3 + cs2 * 2.5);
      }
      // Ceiling - warm pendant lights
      for (var pl2 = bx - w/2 + 3; pl2 < bx + w/2 - 2; pl2 += 4.5) {
        visBox(0.06, 0.8, 0.06, mk(0x888888, 0.5, 0.4), pl2, h - 0.4, bz);
        visCyl(0.3, 0.2, 0.22, 10, ceilLightMat, pl2, h - 0.85, bz);
      }

    } else if (type === 'wgt') {
      // Weight room floor - rubber mat
      var rubberMat = makeTex(128, 128, function(c2, w2, h2) {
        c2.fillStyle = '#222222'; c2.fillRect(0,0,w2,h2);
        for (var i2=0;i2<1000;i2++) {
          c2.fillStyle='rgba(50,50,50,'+Math.random()+')'; c2.fillRect(Math.random()*w2,Math.random()*h2,3,3);
        }
      });
      rubberMat.repeat.set(4,4);
      visBox(w-0.8, 0.05, d-0.8, new THREE.MeshStandardMaterial({map:rubberMat, roughness:0.98}), bx, 0.1, bz);
      // Weight benches
      var benchMat2 = mk(0x222222, 0.6);
      var padMat = mk(0x3344aa, 0.7);
      [-4, 0, 4].forEach(function(boff) {
        solidBox(0.25, 0.45, 1.4, benchMat2, bx + boff, 0, bz - 1.5);
        solidBox(0.25, 0.45, 0.4, benchMat2, bx + boff - 0.5, 0.45, bz - 1.5 - 0.5);
        solidBox(0.22, 0.12, 1.38, padMat, bx + boff, 0.45, bz - 1.5);
      });
      // Barbell racks with bars and weights
      solidBox(0.12, 1.5, 0.12, MT.pol, bx - 3.5, 0, bz + 0.8);
      solidBox(0.12, 1.5, 0.12, MT.pol, bx - 2.5, 0, bz + 0.8);
      solidBox(0.12, 1.5, 0.12, MT.pol, bx + 2.5, 0, bz + 0.8);
      solidBox(0.12, 1.5, 0.12, MT.pol, bx + 3.5, 0, bz + 0.8);
      visBox(2.0, 0.07, 0.07, MT.pol, bx - 3.0, 1.45, bz + 0.8);
      visBox(2.0, 0.07, 0.07, MT.pol, bx + 3.0, 1.45, bz + 0.8);
      // Weight plates
      var plateMat2 = mk(0x111111, 0.5, 0.4);
      var redPlate = mk(0xcc2222, 0.6);
      [-0.6, 0.6].forEach(function(poff) {
        visCyl(0.28, 0.28, 0.1, 16, redPlate, bx - 3.0 + poff*1.2, 1.45, bz + 0.8);
        visCyl(0.22, 0.22, 0.1, 16, plateMat2, bx - 3.0 + poff*1.6, 1.45, bz + 0.8);
      });
      // Dumbbell rack
      solidBox(2.5, 0.9, 0.7, mk(0x333333, 0.8), bx + w/2 - 2, 0, bz - 3);
      for (var db2 = 0; db2 < 5; db2++) {
        visCyl(0.16, 0.16, 0.5, 8, mk(0xdd5522, 0.7), bx + w/2 - 3 + db2*0.5, 1.0, bz - 3);
      }
      // Mirror wall
      solidBox(0.06, h - 0.5, d - 1, new THREE.MeshStandardMaterial({color:0xcceeee, roughness:0.02, metalness:0.9, envMapIntensity:2}), bx + w/2 - 0.55, 0, bz);
      // Ceiling lights
      for (var lx3 = bx - w/2 + 2; lx3 < bx + w/2 - 1; lx3 += 4) {
        visBox(0.35, 0.06, 1.8, ceilLightMat, lx3, h - 0.07, bz);
      }
    }
  }

  // ============================================================
  // STANDALONE GYM BUILDER (not inside building() call)
  // Proper basketball gym with center court + side bleachers
  // ============================================================
  function buildGym(gx, gz) {
    var gw = 42, gd = 32, gh = 14;

    // -- EXTERIOR SHELL ------------------------------------------
    // West wall — split with back door at center (opposite east entrance)
    solidBox(0.5, gh, (gd - 3.2) / 2, MT.wG, gx - gw/2 + 0.25, 0, gz - (gd/4 + 0.8));
    solidBox(0.5, gh, (gd - 3.2) / 2, MT.wG, gx - gw/2 + 0.25, 0, gz + (gd/4 + 0.8));
    solidBox(0.5, gh - 3.2, 3.2, MT.wG, gx - gw/2 + 0.25, 3.2, gz);
    // East wall — split with main entrance door at center (z=gz), opening 3.2 wide
    solidBox(0.5, gh, (gd - 3.2) / 2, MT.wG, gx + gw/2 - 0.25, 0, gz - (gd/4 + 0.8));
    solidBox(0.5, gh, (gd - 3.2) / 2, MT.wG, gx + gw/2 - 0.25, 0, gz + (gd/4 + 0.8));
    solidBox(0.5, gh - 3.2, 3.2, MT.wG, gx + gw/2 - 0.25, 3.2, gz);
    // South wall — solid (side door removed)
    solidBox(gw, gh, 0.5, MT.wG, gx, 0, gz + gd/2 - 0.25);
    // North wall — built inside bleacher section below
    // Roof
    solidBox(gw + 0.6, 0.8, gd + 0.6, MT.roofG, gx, gh, gz);
    // East entrance exterior ramp/curb
    solidBox(0.9, 0.18, 5.5, MT.stt, gx + gw/2 + 0.65, 0, gz);
    addSurf(gx + gw/2 + 0.65, gz, 0.9, 5.5, 0.18);
    // Door on east wall (main entrance)
    var gymDoor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.1, 2.8), MT.dr);
    gymDoor.position.set(gx + gw/2 - 0.05, 1.55, gz);
    gymDoor.castShadow = true; SCN.add(gymDoor);
    var _gdMin = new THREE.Vector3(gx + gw/2 - 0.28, 0, gz - 1.4);
    var _gdMax = new THREE.Vector3(gx + gw/2 + 0.28, 3.15, gz + 1.4);
    var gymDoorCol = new THREE.Box3(_gdMin.clone(), _gdMax.clone());
    DOORS.push({ mesh: gymDoor, open: false, cx: gx + gw/2 - 0.05, cz: gz,
                 col: gymDoorCol, origMin: _gdMin.clone(), origMax: _gdMax.clone(), wallAxis: 'x' });
    // Door on west wall (back exit)
    var gymWDoor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.1, 2.8), MT.dr);
    gymWDoor.position.set(gx - gw/2 + 0.05, 1.55, gz);
    gymWDoor.castShadow = true; SCN.add(gymWDoor);
    var _gwdMin = new THREE.Vector3(gx - gw/2 - 0.28, 0, gz - 1.4);
    var _gwdMax = new THREE.Vector3(gx - gw/2 + 0.28, 3.15, gz + 1.4);
    var gymWDoorCol = new THREE.Box3(_gwdMin.clone(), _gwdMax.clone());
    DOORS.push({ mesh: gymWDoor, open: false, cx: gx - gw/2 + 0.05, cz: gz,
                 col: gymWDoorCol, origMin: _gwdMin.clone(), origMax: _gwdMax.clone(), wallAxis: 'x' });
    // West exterior step
    solidBox(0.9, 0.18, 5.5, MT.stt, gx - gw/2 - 0.65, 0, gz);
    addSurf(gx - gw/2 - 0.65, gz, 0.9, 5.5, 0.18);
    // High windows on west wall — skip area near back door (gz ± 4.5)
    for (var ww = gz - gd/2 + 3; ww < gz + gd/2 - 2; ww += 4.5) {
      if (Math.abs(ww - gz) < 4.5) continue;
      visBox(0.12, 1.8, 2.2, MT.win, gx - gw/2 - 0.02, gh*0.6, ww);
    }
    // High windows on east wall — skip area near door gap (gz ± 4.5)
    for (var ww2 = gz - gd/2 + 3; ww2 < gz + gd/2 - 2; ww2 += 4.5) {
      if (Math.abs(ww2 - gz) < 4.5) continue;
      visBox(0.12, 1.8, 2.2, MT.win, gx + gw/2 + 0.02, gh*0.6, ww2);
    }
    // East entrance sign — visible from spawn
    var eastEntrSp = mkLabel('>> ENTER GYM  /  ORIENTATION <<', 18);
    eastEntrSp.position.set(gx + gw/2 + 2.0, gh * 0.55, gz);
    // West back exit sign (exterior)
    var westExitSp = mkLabel('Gym Back Exit', 12);
    westExitSp.position.set(gx - gw/2 - 2.0, gh * 0.45, gz);

    // -- GYM FLOOR ------------------------------------------------
    var gymFloorTex = makeTex(512, 512, function(c2, w2, h2) {
      // Maple hardwood planks
      var pw2 = 20;
      for (var col2 = 0; col2 < w2/pw2; col2++) {
        var hue2 = 32 + col2 * 0.8;
        var light2 = 44 + Math.sin(col2*0.9)*5;
        c2.fillStyle='hsl('+hue2+',55%,'+light2+'%)';
        c2.fillRect(col2*pw2, 0, pw2, h2);
        // Grain
        for (var g2=0;g2<12;g2++) {
          c2.strokeStyle='rgba(0,0,0,0.07)'; c2.lineWidth=Math.random()*1.5+0.3;
          var gy2 = Math.random()*h2;
          c2.beginPath(); c2.moveTo(col2*pw2, gy2);
          c2.bezierCurveTo(col2*pw2+pw2/2,gy2+Math.random()*12-6,col2*pw2+pw2/2,gy2+Math.random()*12-6,col2*pw2+pw2,gy2+Math.random()*6-3);
          c2.stroke();
        }
        c2.strokeStyle='rgba(0,0,0,0.15)'; c2.lineWidth=1;
        c2.strokeRect(col2*pw2+0.5,0,pw2-1,h2);
      }
      // Polyurethane sheen
      for (var n2=0;n2<500;n2++) {
        c2.fillStyle='rgba(255,255,255,'+(Math.random()*0.05)+')';
        c2.fillRect(Math.random()*w2,Math.random()*h2,Math.random()*20,1);
      }
    });
    gymFloorTex.repeat.set(2, 2);
    var gymFloorMat = new THREE.MeshStandardMaterial({ map: gymFloorTex, color: 0xeecc88, roughness: 0.25, metalness: 0.05 });
    var gymFloor = new THREE.Mesh(new THREE.BoxGeometry(gw - 1, 0.1, gd - 1), gymFloorMat);
    gymFloor.position.set(gx, 0.1, gz); gymFloor.receiveShadow = true; SCN.add(gymFloor);
    addSurf(gx, gz, gw-1, gd-1, 0.1);

    // -- BASKETBALL COURT MARKINGS ---------------------------------
    var lmat = mk(0xffffff, 0.5);
    var rmat2 = mk(0xcc3322, 0.5); // red accent lines (MVHS colors!)

    // Center circle
    var circPts = 32;
    for (var ci3 = 0; ci3 < circPts; ci3++) {
      var a3 = ci3/circPts*Math.PI*2, a4 = (ci3+1)/circPts*Math.PI*2;
      var cx3=(Math.cos(a3)+Math.cos(a4))/2*4.6, cz3=(Math.sin(a3)+Math.sin(a4))/2*4.6;
      var sl3=Math.sqrt((Math.cos(a4)-Math.cos(a3))*(Math.cos(a4)-Math.cos(a3))+(Math.sin(a4)-Math.sin(a3))*(Math.sin(a4)-Math.sin(a3)))*4.6;
      var seg3 = new THREE.Mesh(new THREE.BoxGeometry(sl3+0.05, 0.02, 0.12), lmat);
      seg3.position.set(gx+cx3, 0.16, gz+cz3); seg3.rotation.y=-Math.atan2(Math.sin(a4)-Math.sin(a3),Math.cos(a4)-Math.cos(a3)); SCN.add(seg3);
    }
    // Center dot
    visCyl(0.3, 0.3, 0.02, 16, lmat, gx, 0.16, gz);
    // Half court line
    visBox(gw - 2, 0.02, 0.12, lmat, gx, 0.16, gz);
    // 3-point arcs (both ends)
    [-1, 1].forEach(function(side) {
      var baseX = gx + side * (gw/2 - 4);
      // Three point arc
      var arcPts = 24;
      for (var ai = 0; ai < arcPts; ai++) {
        var ang3 = (ai/arcPts - 0.5) * Math.PI * 0.9;
        var ang4 = ((ai+1)/arcPts - 0.5) * Math.PI * 0.9;
        var x3a = baseX + side * Math.cos(ang3) * 7.0, z3a = gz + Math.sin(ang3) * 7.0;
        var x3b = baseX + side * Math.cos(ang4) * 7.0, z3b = gz + Math.sin(ang4) * 7.0;
        var sl4=Math.sqrt((x3b-x3a)*(x3b-x3a)+(z3b-z3a)*(z3b-z3a));
        var seg4 = new THREE.Mesh(new THREE.BoxGeometry(sl4+0.05, 0.02, 0.1), rmat2);
        seg4.position.set((x3a+x3b)/2, 0.16, (z3a+z3b)/2); seg4.rotation.y=-Math.atan2(z3b-z3a,x3b-x3a); SCN.add(seg4);
      }
      // Key / paint area
      visBox(0.1, 0.02, 10.0, lmat, baseX + side*2.5, 0.16, gz);
      visBox(0.1, 0.02, 10.0, lmat, baseX + side*2.5 - side*5, 0.16, gz);
      visBox(5.0, 0.02, 0.1, lmat, baseX, 0.16, gz - 5);
      visBox(5.0, 0.02, 0.1, lmat, baseX, 0.16, gz + 5);
      // Free throw circle
      for (var fi2 = 0; fi2 < 16; fi2++) {
        var fa0 = fi2/16*Math.PI*2, fa1 = (fi2+1)/16*Math.PI*2;
        var fsl = Math.sqrt(Math.pow((Math.cos(fa1)-Math.cos(fa0))*1.8,2)+Math.pow((Math.sin(fa1)-Math.sin(fa0))*1.8,2));
        var fseg = new THREE.Mesh(new THREE.BoxGeometry(fsl+0.04, 0.02, 0.09), lmat);
        fseg.position.set(baseX+side*(Math.cos(fa0)+Math.cos(fa1))/2*1.8, 0.16, gz+(Math.sin(fa0)+Math.sin(fa1))/2*1.8);
        fseg.rotation.y=-Math.atan2(Math.sin(fa1)-Math.sin(fa0),Math.cos(fa1)-Math.cos(fa0)); SCN.add(fseg);
      }
      // Backboard
      solidBox(0.18, 1.1, 1.8, mk(0xfafafa, 0.2), baseX + side*0.5, 3.3, gz);
      // Target square on backboard
      visBox(0.12, 0.54, 0.9, mk(0xff4422, 0.5), baseX + side*0.44, 3.2, gz);
      visBox(0.12, 0.54, 0.9, mk(0xfafafa, 0.2), baseX + side*0.43, 3.2, gz);
      // Rim
      var rimMat = mk(0xdd6600, 0.5, 0.3);
      for (var ri2=0;ri2<16;ri2++) {
        var ra0=ri2/16*Math.PI*2, ra1=(ri2+1)/16*Math.PI*2;
        var rsl=Math.sqrt(Math.pow((Math.cos(ra1)-Math.cos(ra0))*0.46,2)+Math.pow((Math.sin(ra1)-Math.sin(ra0))*0.46,2));
        var rseg=new THREE.Mesh(new THREE.BoxGeometry(0.04, rsl+0.02, 0.04), rimMat);
        rseg.rotation.x=Math.PI/2; rseg.rotation.z=-Math.atan2(Math.sin(ra1)-Math.sin(ra0),Math.cos(ra1)-Math.cos(ra0));
        rseg.position.set(baseX+side*0.6+(Math.cos(ra0)+Math.cos(ra1))/2*0.46, 3.05, gz+(Math.sin(ra0)+Math.sin(ra1))/2*0.46);
        SCN.add(rseg);
      }
      // Support pole
      solidBox(0.12, 3.05, 0.12, mk(0xaaaaaa, 0.4, 0.5), baseX + side*1.2, 0, gz);
      // Net (visual segments)
      var netMat = mk(0xffffff, 0.8);
      for (var ni2=0;ni2<8;ni2++) {
        var na = ni2/8*Math.PI*2;
        var topX = Math.cos(na)*0.44, topZ = Math.sin(na)*0.44;
        var botX = Math.cos(na)*0.2, botZ = Math.sin(na)*0.2;
        visBox(0.02, 0.55, 0.02, netMat, baseX+side*0.6+topX, 2.78, gz+topZ);
      }
    });

    // -- BLEACHERS - TWO SETS ON LONG SIDES -----------------------
    var blRows = 8, blW = gw - 4;
    var blMats = [mk(0x3355aa, 0.6), mk(0xcc3322, 0.6)];

    // North bleachers — full-width rows, no tunnel
    for (var br2 = 0; br2 < blRows; br2++) {
      var byN = br2 * 0.62;
      var bzN = gz - gd/2 + 0.8 + br2 * 0.85;
      solidBox(blW, 0.32, 0.88, blMats[br2%2], gx, byN, bzN);
      addSurf(gx, bzN, blW, 0.88, byN + 0.32);
      visBox(blW, byN + 0.32, 0.12, mk(0x444444,0.9), gx, (byN+0.32)/2, bzN + 0.38);
    }
    // North wall — fully solid
    solidBox(gw, gh, 0.5, MT.wG, gx, 0, gz - gd/2 + 0.25);

    // South bleachers — front rows near court, back rows near south wall, all facing north
    for (var br3 = 0; br3 < blRows; br3++) {
      var byS = br3 * 0.62;
      // Row 0 = front (lowest, most northerly); row blRows-1 = back (highest, near south wall)
      var bzS = gz + gd/2 - 0.5 - (blRows - 1 - br3) * 0.85;
      solidBox(blW, 0.32, 0.88, blMats[br3%2], gx, byS, bzS);
      addSurf(gx, bzS, blW, 0.88, byS + 0.32);
      // Riser on north side — faces toward court
      visBox(blW, byS+0.32, 0.12, mk(0x444444,0.9), gx, (byS+0.32)/2, bzS - 0.38);
    }

    // -- PODIUM / SPEAKER AREA -----------------------------------
    // Podium near center-south for speaker facing students
    solidBox(1.4, 1.1, 0.8, mk(0x5a3010, 0.7), gx, 0, gz + 4);
    visBox(1.45, 0.08, 0.82, mk(0x3a1a00, 0.5), gx, 1.1, gz + 4, true);
    // Mic stand
    visCyl(0.04, 0.04, 1.2, 6, mk(0x888888, 0.3, 0.7), gx, 0.6, gz + 3.4);
    visCyl(0.1, 0.04, 0.02, 6, mk(0x333333, 0.5), gx, 1.22, gz + 3.4);

    // -- SCOREBOARDS on end walls ---------------------------------
    solidBox(10, 3.2, 0.25, MT.scr, gx, gh - 2.2, gz - gd/2 + 0.35);
    visBox(9.2, 2.7, 0.06, MT.eG, gx, gh - 2.2, gz - gd/2 + 0.5);
    // Score text (emissive boxes simulating digits)
    visBox(1.2, 1.8, 0.06, MT.eG, gx - 2.5, gh - 2.2, gz - gd/2 + 0.52);
    visBox(1.2, 1.8, 0.06, MT.eG, gx + 2.5, gh - 2.2, gz - gd/2 + 0.52);

    // -- CEILING LIGHTS -------------------------------------------
    var highLightMat = new THREE.MeshStandardMaterial({color:0xfffef0, emissive:0xfffee0, emissiveIntensity:2.0});
    for (var lxi = gx - gw/2 + 5; lxi <= gx + gw/2 - 4; lxi += 7) {
      for (var lzi = gz - gd/2 + 5; lzi <= gz + gd/2 - 4; lzi += 7) {
        visBox(0.6, 0.12, 0.6, highLightMat, lxi, gh - 0.08, lzi);
        visBox(0.65, 0.14, 0.65, mk(0xcccccc, 0.4, 0.3), lxi, gh - 0.04, lzi);
      }
    }

    // -- RAFTERS --------------------------------------------------
    for (var rf = gz - gd/2 + 4; rf <= gz + gd/2 - 3; rf += 5) {
      visBox(gw - 1, 0.3, 0.28, mk(0x666666, 0.7, 0.2), gx, gh - 0.5, rf);
    }

    // -- LABEL + ZONE ---------------------------------------------
    var gymSp = mkLabel('Gymnasium', 12);
    gymSp.position.set(gx, gh + 5, gz);
    NPCS.push({x:gx, z:gz, radius:10, label:'Gymnasium', msg:'MVHS Gymnasium - Full basketball court with hardwood floor, bleachers seating 400+. Go Matadors!'});
    ZONES.push({x1: gx-gw/2, x2: gx+gw/2, z1: gz-gd/2, z2: gz+gd/2, name:'Gymnasium'});
  }

  // ============================================================
  // TREE (visual only - high quality)
  // ============================================================
  function tree(x, z, sc) {
    sc = sc || 1;
    // Bark texture
    var barkT = makeTex(64, 128, function(c, w, h) {
      c.fillStyle = '#6a4828'; c.fillRect(0,0,w,h);
      for (var i=0;i<8;i++) {
        c.strokeStyle='rgba(0,0,0,0.18)'; c.lineWidth=Math.random()*3+1;
        c.beginPath(); c.moveTo(Math.random()*w,0); c.lineTo(Math.random()*w,h); c.stroke();
      }
      for (var n=0;n<200;n++){c.fillStyle='rgba(0,0,0,'+Math.random()*0.1+')';c.fillRect(Math.random()*w,Math.random()*h,2,2);}
    });
    barkT.repeat.set(1,2);
    var trunkMat = new THREE.MeshStandardMaterial({ map: barkT, color: 0x7a5530, roughness: 0.95 });
    // Trunk with taper
    visCyl(0.18*sc, 0.34*sc, 2.5*sc, 10, trunkMat, x, 1.25*sc, z);
    // Root flare
    visCyl(0.55*sc, 0.55*sc, 0.3*sc, 8, trunkMat, x, 0.15*sc, z);
    // Foliage - multiple overlapping spheres for volume
    var leafColors = [0x2d7a2a, 0x3a9a38, 0x258a25, 0x4aaa40, 0x1e7020];
    var leafPositions = [
      [0, 0, 0, 2.5], [0.8, 0.5, 0.5, 2.0], [-0.7, 0.8, 0.3, 1.8],
      [0.3, 1.2, -0.6, 1.6], [-0.4, 0.3, -0.8, 1.7], [0, 1.8, 0, 1.4]
    ];
    for (var li=0; li<leafPositions.length; li++) {
      var lp = leafPositions[li];
      var leafMat = new THREE.MeshStandardMaterial({
        color: leafColors[li % leafColors.length], roughness: 0.9,
        side: THREE.DoubleSide
      });
      var leafMesh = new THREE.Mesh(new THREE.SphereGeometry(lp[3]*sc, 8, 6), leafMat);
      leafMesh.position.set(x + lp[0]*sc, 2.5*sc + lp[1]*sc, z + lp[2]*sc);
      leafMesh.castShadow = true;
      leafMesh.scale.set(1, 0.85, 1);
      SCN.add(leafMesh);
    }
    addCol(x, 0, z, 0.7*sc, 4.5*sc, 0.7*sc);
  }

  // ============================================================
  // MISC SOLID HELPERS
  // ============================================================
  function parkingLot(x, z, w, d) {
    // Parking is ground-level, visual only
    visBox(w, 0.06, d, MT.park, x, 0.03, z, true);
    for (var i = -w/2 + 4; i < w/2 - 2; i += 4) visBox(0.13, 0.07, d - 1, MT.pln, x + i, 0.07, z, true);
  }

  function stripes(cx, cz, fw, fd, m1, m2, sw) {
    sw = sw || 4;
    var n = Math.floor(fw / sw);
    for (var i = 0; i < n; i++) visBox(sw - 0.08, 0.06, fd, i%2===0?m1:m2, cx-fw/2+sw*i+sw/2, 0.03, cz, true);
  }

  function oval(cx, cz, rx, rz, thick, h, mat) {
    for (var i = 0; i < 60; i++) {
      var a0=i/60*Math.PI*2, a1=(i+1)/60*Math.PI*2;
      var x0=cx+Math.cos(a0)*rx, z0=cz+Math.sin(a0)*rz;
      var x1=cx+Math.cos(a1)*rx, z1=cz+Math.sin(a1)*rz;
      var mx=(x0+x1)/2, mz=(z0+z1)/2;
      var ang=Math.atan2(z1-z0,x1-x0), sl=Math.sqrt((x1-x0)*(x1-x0)+(z1-z0)*(z1-z0));
      var seg=new THREE.Mesh(new THREE.BoxGeometry(sl+0.1,h,thick),mat);
      seg.position.set(mx,h/2,mz); seg.rotation.y=-ang; seg.receiveShadow=true; SCN.add(seg);
    }
  }

  function fence(x1, z1, x2, z2, fh, n) {
    fh=fh||2.5; n=n||18;
    var dx=x2-x1, dz=z2-z1, len=Math.sqrt(dx*dx+dz*dz);
    for (var i=0;i<=n;i++){var t=i/n; solidBox(0.12,fh,0.12,MT.fnc,x1+dx*t,0,z1+dz*t);}
    var r=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,len,6),MT.fnc);
    r.rotation.z=Math.PI/2; r.rotation.y=-Math.atan2(dz,dx);
    r.position.set((x1+x2)/2,fh*0.72,(z1+z2)/2); SCN.add(r);
  }

  function lpole(x, z) {
    solidBox(0.24, 9, 0.24, MT.pol, x, 0, z);
    visBox(3.8, 0.24, 0.38, MT.pol, x, 9, z);
    visSph(0.32, MT.eY, x-1.4, 9.35, z);
    visSph(0.32, MT.eY, x+1.4, 9.35, z);
  }

  function bleachers(bx, bz, w, rows, ry) {
    var cos2=Math.cos(ry||0), sin2=Math.sin(ry||0);
    for (var r=0;r<rows;r++) {
      var sx=bx+(-sin2*r*0.82), sz=bz+(cos2*r*0.82);
      solidBox(w, 0.32, 0.9, r%2===0?MT.bl:MT.blS, sx, r*0.62, sz);
      addSurf(sx, sz, w, 0.9, r*0.62+0.32);
    }
  }

  function flagpole(x, z) {
    solidBox(0.18, 14, 0.18, MT.pol, x, 0, z);
    visBox(2.6, 1.5, 0.07, MT.flg, x+1.3, 13.2, z);
    visBox(2.6, 0.5, 0.07, MT.pln, x+1.3, 12.0, z);
    NPCS.push({ x: x, z: z, radius: 4, label: 'Flag Pole', msg: 'Go Matadors! MVHS - Red and Black since 1969.' });
  }

  // ============================================================
  // PROGRESS BAR
  // ============================================================
  var lbar = document.getElementById('w3d-lbar');
  var lmsg = document.getElementById('w3d-lmsg');
  function prog(p, m) { if(lbar) lbar.style.width = p + '%'; if(lmsg) lmsg.textContent = m; }

  // ============================================================
  // BUILD THE WORLD
  // ============================================================
  prog(4, 'Ground and sky...');

  // Ground - large flat surface
  var gnd = new THREE.Mesh(new THREE.PlaneGeometry(900, 900, 40, 40), MT.grass);
  gnd.rotation.x = -Math.PI/2; gnd.receiveShadow = true; SCN.add(gnd);
  addSurf(0, 0, 900, 900, 0); // the ground itself is a surface

  // Sky dome with gradient texture
  var skyTex = makeTex(512, 512, function(c, w, h) {
    var grad = c.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a5a9a');
    grad.addColorStop(0.3, '#3a8ccc');
    grad.addColorStop(0.65, '#7ab8e8');
    grad.addColorStop(0.85, '#b8d8ee');
    grad.addColorStop(1, '#ddeeff');
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
    // Sun halo
    var sg = c.createRadialGradient(w*0.7, h*0.3, 0, w*0.7, h*0.3, 80);
    sg.addColorStop(0, 'rgba(255,250,200,0.7)');
    sg.addColorStop(0.3, 'rgba(255,240,150,0.2)');
    sg.addColorStop(1, 'rgba(255,240,150,0)');
    c.fillStyle = sg; c.fillRect(0, 0, w, h);
  });
  var skyDome = new THREE.Mesh(
    new THREE.SphereGeometry(750, 32, 16),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, transparent: true, depthWrite: false })
  );
  SCN.add(skyDome);

  // Cloud sprites (textured billboards)
  var cloudTex = makeTex(256, 128, function(c, w, h) {
    var cg = c.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
    cg.addColorStop(0, 'rgba(255,255,255,1)');
    cg.addColorStop(0.4, 'rgba(245,248,255,0.9)');
    cg.addColorStop(0.7, 'rgba(220,230,248,0.5)');
    cg.addColorStop(1, 'rgba(200,215,240,0)');
    c.fillStyle = cg; c.fillRect(0, 0, w, h);
    // Puffs
    [[0.25,0.4,0.28],[0.5,0.3,0.36],[0.75,0.45,0.24]].forEach(function(p) {
      var pg = c.createRadialGradient(p[0]*w,p[1]*h,0,p[0]*w,p[1]*h,p[2]*w);
      pg.addColorStop(0,'rgba(255,255,255,0.95)');
      pg.addColorStop(0.5,'rgba(240,245,255,0.6)');
      pg.addColorStop(1,'rgba(220,235,250,0)');
      c.fillStyle=pg; c.fillRect(0,0,w,h);
    });
  });
  var cloudMat = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.88 });
  var cloudData = [
    [100,200,50,220,70],[  -80,185,-120,180,55],[ 200,170,80,200,60],
    [-200,195,100,240,65],[0,180,200,190,58],[140,210,-60,170,52],
    [-130,188,40,210,60],[60,175,180,165,48]
  ];
  var cloudSprites = [];
  for (var ci=0;ci<cloudData.length;ci++) {
    var cd=cloudData[ci];
    var csp=new THREE.Sprite(cloudMat.clone());
    csp.position.set(cd[0],cd[1],cd[2]);
    csp.scale.set(cd[3],cd[4],1);
    SCN.add(csp);
    cloudSprites.push(csp);
  }

  prog(9, 'Roads and paths...');
  visBox(900,0.15,14,MT.road,0,0.07,140,true);
  visBox(900,0.18,0.4,MT.rline,0,0.16,140,true);
  visBox(300,0.1,2,MT.side,0,0.05,-88,true);
  visBox(300,0.1,2,MT.side,0,0.05,82,true);
  visBox(2,0.1,170,MT.side,-148,0.05,-3,true);
  visBox(2,0.1,170,MT.side,148,0.05,-3,true);
  var ipaths=[-65,-25,15,55]; for(var ip=0;ip<ipaths.length;ip++) visBox(0.9,0.08,170,MT.path,ipaths[ip],0.04,0,true);
  var jpaths=[-52,-12,8,45]; for(var jp=0;jp<jpaths.length;jp++) visBox(300,0.08,0.9,MT.path,0,0.04,jpaths[jp],true);
  visBox(50,0.1,3,MT.side,0,0.05,14,true);

  prog(16, 'Parking lots...');
  parkingLot(-112,-48,52,60); parkingLot(-112,28,52,82);
  var lpa=[[-92,-62],[-92,-32],[-92,2],[-92,35],[-132,-62],[-132,-32],[-132,2],[-132,35]];
  for(var li=0;li<lpa.length;li++) lpole(lpa[li][0],lpa[li][1]);
  mkLabel('Student Parking',10).position.set(-112,5,-30);
  NPCS.push({x:-112,z:-30,radius:7,label:'Student Parking',msg:'Student Parking Lot - 400 spots. Permit required. Watch for speed bumps.'});
  parkingLot(82,-72,82,42);
  var lpb=[[62,-82],[102,-82],[62,-62],[102,-62]]; for(var li2=0;li2<lpb.length;li2++) lpole(lpb[li2][0],lpb[li2][1]);
  mkLabel('Staff Parking',10).position.set(82,5,-72);
  NPCS.push({x:82,z:-72,radius:7,label:'Staff Parking',msg:'Staff Parking - Faculty and staff permits only.'});
  ZONES.push({x1:-148,x2:-70,z1:-90,z2:-10,name:'Student Parking'});
  ZONES.push({x1:40,x2:148,z1:-90,z2:-50,name:'Staff Parking'});

  prog(24, 'Building A - Administration...');
  building(-32,-74,30,15,9,MT.wA,MT.roofR,'Bldg A - Administration',2,'cls');
  ZONES.push({x1:-47,x2:-17,z1:-82,z2:-60,name:'Building A'});

  prog(29, 'Buildings B and D...');
  building(12,-74,26,15,11,MT.wB,MT.roofR,'Building B',2,'cls');
  // Bridge B-D (solid walkable)
  solidBox(10,3.5,3.8,MT.wB,32,8.5,-74);
  addSurf(32,-74,10,3.8,8.5+3.5);
  building(50,-74,26,15,11,MT.wB,MT.roofR,'Building D',2,'cls');

  prog(34, 'Buildings C and E...');
  building(-32,-54,26,13,9,MT.wA,MT.roofR,'Building C',2,'cls');
  building(12,-54,24,13,9,MT.wA,MT.roofR,'Bldg E - Science',2,'cls');

  // ── Science Building: interior staircase + accessible 2nd floor ──
  (function buildScienceFloor2() {
    var bx=12, bz=-54, bw=24, bd=13, bh=9;
    var f2=bh/2; // 4.5 — second floor Y

    // Interior staircase in the back-right corner
    // 9 steps × 0.5Y rise, 0.5Z run → total climb = 4.5 units
    var sX=22, sW=3.0, sZs=-59.5;
    for (var si=0; si<9; si++) {
      solidBox(sW, 0.3, 0.48, MT.stt, sX, si*0.5, sZs + si*0.5);
      addSurf(sX, sZs + si*0.5, sW, 0.48, si*0.5 + 0.3);
    }
    // Stair side wall (slim guardrail along left side of stairs)
    for (var gi=0; gi<4; gi++) {
      solidBox(0.12, 0.65, 0.48, MT.wA, sX - sW/2 - 0.06, gi*1.0 + 0.5, sZs + gi*1.0 + 0.25);
    }

    // Landing at top — connects stairs to 2nd floor interior
    var landZ = sZs + 9*0.5; // = -55.0
    var landLen = bz + bd/2 - 0.5 - landZ; // front of interior - landZ ≈ 8.0
    solidBox(sW, 0.18, landLen, MT.stt, sX, f2, landZ + landLen/2);
    addSurf(sX, landZ + landLen/2, sW, landLen, f2 + 0.18);

    // 2nd floor main interior floor (all except staircase footprint)
    var mainW = bw - 0.7 - sW - 0.6; // = 24-0.7-3.0-0.6 = 19.7
    var mainX = bx - (sW + 0.6)/2;   // offset left of staircase
    surfBox(mainW, 0.18, bd - 0.7, MT.fl, mainX, f2, bz);

    // Guardrail at the stair opening on 2nd floor (safety railing)
    solidBox(sW, 0.85, 0.12, MT.pol, sX, f2 + 0.18, landZ + 0.06);
    // Side railing (along X edge of stairs)
    solidBox(0.12, 0.85, landLen, MT.pol, sX - sW/2 - 0.06, f2 + 0.18, landZ + landLen/2);

    // 2nd floor lab content — lab tables in 2 rows
    for (var lr=0; lr<2; lr++) {
      for (var lc=0; lc<3; lc++) {
        visBox(1.5, 0.08, 0.85, MT.dsk, bx - 7 + lc*5.5, f2 + 0.75, bz - 3 + lr*4.5);
        // Chair in front of each desk
        visBox(0.65, 0.6, 0.65, MT.chr, bx - 7 + lc*5.5, f2 + 0.38, bz - 1.7 + lr*4.5);
      }
    }

    // Whiteboard on back (north) wall of 2nd floor
    visBox(8.0, 2.0, 0.12, MT.brd, bx - 4, f2 + 1.8, bz - bd/2 + 0.46);
    visBox(7.6, 1.65, 0.05, MT.chk, bx - 4, f2 + 1.8, bz - bd/2 + 0.52);
    // Teacher's desk at front (south) wall 2nd floor
    solidBox(1.6, 0.08, 1.0, MT.dsk, bx - 9, f2 + 0.75, bz + bd/2 - 2.5);
    // Ceiling lights 2nd floor
    visBox(2.5, 0.12, 0.38, ceilLightMat, bx - 5, f2 + bh/2 - 0.08, bz - 2);
    visBox(2.5, 0.12, 0.38, ceilLightMat, bx - 5, f2 + bh/2 - 0.08, bz + 2);

    // Label sprite above 2nd floor
    var sp2 = mkLabel('Science — Rm 201', 11);
    sp2.position.set(bx - 4, bh + 2.5, bz);
    NPCS.push({ x: bx - 3, z: bz, radius: 7, label: 'Science Room 201 (2F)',
      msg: 'Science Room 201 — 2nd Floor. Stairs in the back-right corner (east wall).' });
  })();

  prog(39, 'F Buildings...');
  var fbx=[-72,-44,-14,16,44];
  for(var fi=0;fi<fbx.length;fi++) building(fbx[fi],-32,18,13,8,MT.wB,MT.roof2,'Bldg F'+(fi+1),1,'cls');

  prog(44, 'Library and Physics...');
  building(76,-56,24,17,10,MT.wB,MT.roofC,'Library',2,'lib');
  ZONES.push({x1:64,x2:90,z1:-66,z2:-44,name:'Library'});
  building(76,-32,24,15,9,MT.wA,MT.roofP,'Physics + Science',2,'cls');

  prog(50, 'Gymnasium...');
  buildGym(-92, -62);

  // Biology Room 102 — south of gym, door faces west toward club fair
  (function buildBioRoom() {
    var bx = -97, bz = -36, bw = 22, bd = 14, bh = 7, dW = 3.0;
    surfBox(bw-0.6, 0.18, bd-0.6, MT.fl, bx, 0, bz);
    visBox(bw-0.6, 0.15, bd-0.6, MT.con, bx, bh, bz);
    solidBox(bw+0.6, 0.75, bd+0.6, MT.roofR, bx, bh, bz);
    // North, south, east walls — solid
    solidBox(bw, bh, 0.5, MT.wA, bx, 0, bz - bd/2 + 0.25);
    solidBox(bw, bh, 0.5, MT.wA, bx, 0, bz + bd/2 - 0.25);
    solidBox(0.5, bh, bd, MT.wA, bx + bw/2 - 0.25, 0, bz);
    // West wall — split with door at center
    solidBox(0.5, bh, (bd - dW) / 2, MT.wA, bx - bw/2 + 0.25, 0, bz - (bd/4 + dW/4));
    solidBox(0.5, bh, (bd - dW) / 2, MT.wA, bx - bw/2 + 0.25, 0, bz + (bd/4 + dW/4));
    solidBox(0.5, bh - 3.1, dW, MT.wA, bx - bw/2 + 0.25, 3.1, bz);
    // West door
    var bioD = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.1, 2.8), MT.dr);
    bioD.position.set(bx - bw/2 + 0.05, 1.55, bz);
    bioD.castShadow = true; SCN.add(bioD);
    var _bdMin = new THREE.Vector3(bx - bw/2 - 0.28, 0, bz - 1.4);
    var _bdMax = new THREE.Vector3(bx - bw/2 + 0.28, 3.15, bz + 1.4);
    DOORS.push({ mesh: bioD, open: false, cx: bx - bw/2 + 0.05, cz: bz,
                 col: new THREE.Box3(_bdMin.clone(), _bdMax.clone()),
                 origMin: _bdMin.clone(), origMax: _bdMax.clone(), wallAxis: 'x' });
    // Windows
    for (var bwi = bx - bw/2 + 3; bwi < bx + bw/2 - 2; bwi += 3.2) {
      visBox(1.1, 1.2, 0.12, MT.win, bwi, bh*0.5, bz + bd/2 + 0.02);
      visBox(1.1, 1.2, 0.12, MT.win, bwi, bh*0.5, bz - bd/2 - 0.02);
    }
    // Interior desks
    for (var bdr = 0; bdr < 3; bdr++) {
      for (var bdc = 0; bdc < 4; bdc++) {
        solidBox(1.4, 0.08, 0.9, MT.dsk, bx - 6 + bdc * 4, 0.75, bz - 3.5 + bdr * 3.5);
      }
    }
    var bioSp = mkLabel('Biology — Room 102', 13);
    bioSp.position.set(bx, bh + 4, bz);
    NPCS.push({ x: bx, z: bz, radius: 8, label: 'Biology Room 102',
      msg: 'Biology Room 102 — Period 1. West door opens toward the Club Fair.' });
    ZONES.push({ x1: bx-bw/2, x2: bx+bw/2, z1: bz-bd/2, z2: bz+bd/2, name: 'Biology Room 102' });
  })();

  // ── ORIENTATION NPC BODIES ──────────────────────────────────
  // Helper: place a simple character mesh (cylinder body + sphere head)
  function npcBody(x, z, y, shirtHex, skinHex) {
    var sm = mk(shirtHex||0x3355aa, 0.7);
    var hm = mk(skinHex||0xf4c08a, 0.5);
    visCyl(0.18, 0.22, 0.9, 8, sm, x, y + 0.45, z);   // torso
    visSph(0.19, hm, x, y + 1.12, z);                  // head
  }

  // Shirt color palette for crowd variety
  var shirtCols = [0x3355cc, 0xcc3322, 0x228833, 0xcc8800, 0x882299,
                   0x117788, 0xcc4422, 0x336688, 0xee6644, 0x3399aa,
                   0xaa2244, 0x668833, 0x4455bb, 0xcc7700, 0x559944];
  var skinCols  = [0xf4c08a, 0xe8a070, 0xd08858, 0xc07040, 0xfad4a0,
                   0xe8b880, 0xd4906a, 0xba7248];

  var npcIdx = 0;
  function rndNPC(x, z, rowY) {
    var sc = shirtCols[npcIdx % shirtCols.length];
    var hc = skinCols[Math.floor(npcIdx / 2) % skinCols.length];
    npcBody(x, z, rowY, sc, hc);
    npcIdx++;
  }

  // South bleachers (rows 0–6, starting at gz+gd/2-3.5 = -49.5, step -0.85)
  var xSpots = [-108, -104, -100, -96, -92, -88, -84, -80, -76];
  for (var srN = 0; srN < 6; srN++) {
    var seatY = srN * 0.62 + 0.32;
    var seatZ = -62 + 16 - 3.5 - srN * 0.85;
    // Fill most spots, leave some gaps for realism
    for (var sx = 0; sx < xSpots.length; sx++) {
      if (srN === 0 && sx === 4) continue; // leave gap at center front
      rndNPC(xSpots[sx], seatZ - 0.2, seatY);
    }
  }
  // North bleachers (rows 0–5, inside near north wall)
  for (var nrN = 0; nrN < 5; nrN++) {
    var nseatY = nrN * 0.62 + 0.32;
    var nseatZ = -62 - 16 + 0.8 + nrN * 0.85 + 0.2;
    for (var nx2 = 0; nx2 < xSpots.length; nx2++) {
      if (nrN < 2 && (nx2 < 2 || nx2 > 6)) continue; // sparse outer rows
      rndNPC(xSpots[nx2], nseatZ, nseatY);
    }
  }

  // Coach Rivera at the podium — distinctive outfit
  npcBody(-92, -58, 0, 0x1a1a5a, 0xe8b880);  // dark navy jacket

  // ── STORY NPCs around gym entrance ─────────────────────────
  // Alex — right outside east gym entrance
  NPCS.push({x:-64, z:-55, radius:3.5, label:'Alex Chen',
    msg:'"Hey — you\'re new too, right? First day. Yeah. I don\'t know anyone either. The gym entrance is right there — orientation\'s about to start."'});
  npcBody(-64, -55, 0, 0x4488cc, 0xf4c08a);

  // Jordan — just inside east entrance (in gym)
  NPCS.push({x:-74, z:-62, radius:3.5, label:'Jordan Park',
    msg:'"I heard the popular kids always claim the front bleachers on day one. No idea if that\'s true. Probably is."'});
  npcBody(-74, -62, 0, 0xcc4422, 0xd08858);

  // Maya — south of east entrance, waiting
  NPCS.push({x:-68, z:-68, radius:3.5, label:'Maya Torres',
    msg:'"My older sister said freshman orientation is basically just the principal telling you not to use your phone. Forty-five minutes."'});
  npcBody(-68, -68, 0, 0xaa44aa, 0xe8a070);

  // Upperclassman leaning on east wall
  NPCS.push({x:-68, z:-54, radius:4, label:'Upperclassman',
    msg:'"Oh, freshmen. Every year." (He doesn\'t stop walking.)'});
  npcBody(-68, -54, 0, 0x222222, 0xd4906a);

  // Coach Rivera NPC info point (at podium)
  NPCS.push({x:-92, z:-58, radius:5, label:'Coach Rivera',
    msg:'Coach Rivera adjusts the mic. "Welcome to Monta Vista High School. Please find your seats — orientation begins in two minutes."'});

  // Naomi — south bleachers, front row
  NPCS.push({x:-84, z:-56, radius:3, label:'Naomi Walsh',
    msg:'"Front row. I know everyone thinks it\'s try-hard, but I actually want to hear what they\'re saying." She has a pen out already.'});

  // Tyler — south bleachers center
  NPCS.push({x:-97, z:-55, radius:3, label:'Tyler Brooks',
    msg:'Tyler looks up from his phone. "You can sit here." A pause. "If you want." The offer doesn\'t last long.'});

  // Devon — north bleachers, back row
  NPCS.push({x:-88, z:-76, radius:3, label:'Devon Clark',
    msg:'"Back row. You can see everything from up here and nobody bothers you. That\'s the whole thing."'});

  // ── ORIENTATION SIGN outside east gym entrance ──────────────
  var orSign = mkLabel('← FRESHMAN ORIENTATION', 13);
  orSign.position.set(-62, 5, -62);
  var orSign2 = mkLabel('Enter gym for orientation', 9);
  orSign2.position.set(-62, 3.5, -62);

  // ── ADDITIONAL STORY NPCs (freshman accessible zone) ────────
  // Teacher directing students east toward the gym
  NPCS.push({x:-80, z:-40, radius:4, label:'Ms. Patel',
    msg:'Ms. Patel waves you toward the gym. "Freshmen orientation is in the gym — east entrance, right over there. You have about three minutes."'});
  npcBody(-80, -40, 0, 0x2244aa, 0xf0c090);

  // Student sitting outside, skipping
  NPCS.push({x:-100, z:-35, radius:4, label:'Kid Skipping Orientation',
    msg:'"I\'ve been to like four of these. New school, same speech. Coach says attendance mandatory though, so." He doesn\'t move.'});
  npcBody(-100, -35, 0, 0x334433, 0xd4906a);

  // Nervous freshman near east entrance
  NPCS.push({x:-65, z:-70, radius:3.5, label:'Nervous Freshman',
    msg:'"Is this where we go? For orientation? I\'ve walked past three times already trying to look like I know where I\'m going."'});
  npcBody(-65, -70, 0, 0x7788bb, 0xfad4a0);

  // Student group on west side of restricted zone
  NPCS.push({x:-125, z:-45, radius:4, label:'Sakura Yamamoto',
    msg:'"My brother warned me about freshman orientation. Said it\'s actually pretty important — first impressions and all that. Where you sit matters."'});
  npcBody(-125, -45, 0, 0xcc4488, 0xe8b080);

  NPCS.push({x:-120, z:-55, radius:4, label:'Marcus Webb',
    msg:'"I heard there are already cliques forming. Like, people already know who\'s popular and who isn\'t. Day one. That\'s wild."'});
  npcBody(-120, -55, 0, 0x336699, 0xba7248);

  // Near east entrance, quiet observer
  NPCS.push({x:-70, z:-50, radius:3.5, label:'Quiet Student',
    msg:'She\'s writing something in a small notebook. She looks up briefly. "Sorry — just writing down first impressions. It\'s a thing I do."'});
  npcBody(-70, -50, 0, 0x886699, 0xf0c090);

  // Campus map sign near restriction boundary
  NPCS.push({x:-100, z:-25, radius:5, label:'Campus Map',
    msg:'MONTA VISTA HIGH SCHOOL\nMain campus beyond the gates — Buildings A through F, Cafeteria, Library.\nFreshmen: report to the gym (east entrance) for orientation first.'});

  prog(54, 'Weight room...');
  building(-92,-12,22,13,6,mk(0xd0c8b8),mk(0x506070),'Weight Room',1,'wgt');
  NPCS.push({x:-92,z:-12,radius:6,label:'Weight Room',msg:'Weight Room - Bench press, squat racks, free weights. Open 6am-8pm.'});

  // ============================================================
  // CLUB FAIR — west of locker rooms, within freshman zone
  // Booths at z=-34, x=-115/-125/-135 (requires exploration to find)
  // Funnel signs guide players south from the gym
  // ============================================================
  prog(56, 'Club fair...');

  // ── Semi-transparent freshman restriction barriers ──
  // Panels mark the actual freshman zone boundary (px -138...-65, pz -85...-22).
  var _barrMat  = new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
  var _barrGlow = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.07, side: THREE.DoubleSide });
  // East wall — x = -65 (main campus off-limits; full freshman zone z range)
  visBox(0.12, 6.0, 63, _barrMat,  -65, 3.0, -53.5);
  visBox(0.30, 6.5, 64, _barrGlow, -65, 3.0, -53.5);
  // West wall — x = -138
  visBox(0.12, 4.0, 63, _barrMat,  -138, 2.0, -53.5);
  visBox(0.30, 4.4, 64, _barrGlow, -138, 2.0, -53.5);
  // North wall — z = -85
  visBox(73, 4.0, 0.12, _barrMat,  -101.5, 2.0, -85);
  visBox(74, 4.4, 0.30, _barrGlow, -101.5, 2.0, -85);
  // South wall — z = -22
  visBox(73, 4.0, 0.12, _barrMat,  -101.5, 2.0, -22);
  visBox(74, 4.4, 0.30, _barrGlow, -101.5, 2.0, -22);
  // Overhead banner
  var _cfBanner = mkLabel('— MONTA VISTA CLUB FAIR —', 14);
  _cfBanner.position.set(-125, 7.0, -34);

  // ── Single booth builder ──
  function _clubBooth(cx, cz, col, labelTxt) {
    // Tabletop (solid – blocks the player when walking into it)
    solidBox(3.6, 0.12, 1.8, mk(col, 0.72), cx, 0.9, cz);
    // Legs (visual only)
    var legM = mk(0x888888, 0.5, 0.3);
    visBox(0.1, 0.9, 0.1, legM, cx-1.6, 0.45, cz-0.8);
    visBox(0.1, 0.9, 0.1, legM, cx+1.6, 0.45, cz-0.8);
    visBox(0.1, 0.9, 0.1, legM, cx-1.6, 0.45, cz+0.8);
    visBox(0.1, 0.9, 0.1, legM, cx+1.6, 0.45, cz+0.8);
    // Backdrop banner panel (solid)
    solidBox(3.8, 3.2, 0.12, mk(col, 0.78), cx, 2.5, cz - 1.3);
    // Vertical banner poles
    solidBox(0.1, 4.6, 0.1, MT.pol, cx - 1.85, 0, cz - 1.3);
    solidBox(0.1, 4.6, 0.1, MT.pol, cx + 1.85, 0, cz - 1.3);
    // Horizontal top rail
    visBox(3.8, 0.1, 0.1, MT.pol, cx, 4.55, cz - 1.3);
    // Floating label above booth
    var sp = mkLabel(labelTxt, 9);
    sp.position.set(cx, 5.6, cz);
    // NPC info point
    NPCS.push({ x: cx, z: cz, radius: 5, label: labelTxt,
      msg: 'Walk up to this booth to make your choice. Press E for info.' });
  }

  _clubBooth(-115, -34, 0x1a3a70, 'ROBOTICS CLUB');   // dark blue
  _clubBooth(-125, -34, 0x701a1a, 'FOOTBALL TEAM');   // dark red
  _clubBooth(-135, -34, 0x2a4a2a, 'NO COMMITMENT');   // dark green

  ZONES.push({ x1: -140, x2: -108, z1: -42, z2: -26, name: 'Club Fair' });

  prog(58, 'Cafeteria and Student Union...');
  building(0,-10,40,24,10,MT.wC,MT.roofC,'Cafeteria + Student Union',2,'caf');
  ZONES.push({x1:-22,x2:22,z1:-24,z2:6,name:'Cafeteria'});
  // Veranda (solid)
  solidBox(40,0.45,7,mk(0xe0c080),0,0,4);
  addSurf(0,4,40,7,0.45);
  for(var vx=-18;vx<=18;vx+=5) solidBox(0.44,3.2,0.44,MT.pol,vx,0.45,7);
  // Amphitheater steps (solid + surface)
  for(var as=0;as<4;as++) {
    solidBox(22,0.5,2.2,MT.stt,0,as*0.5,12+as*2);
    addSurf(0,12+as*2,22,2.2,as*0.5+0.5);
  }
  NPCS.push({x:0,z:14,radius:6,label:'Amphitheater',msg:'Outdoor Amphitheater - all-school assemblies and performances. Walk up the steps!'});
  ZONES.push({x1:-11,x2:11,z1:8,z2:22,name:'Amphitheater'});

  prog(62, 'Theater and other buildings...');
  building(52,-10,22,17,10,mk(0xe0c8a0),MT.roofT,'Theater',1,'cls');
  building(82,-10,18,15,9,MT.wB,MT.roofR,'Building G',2,'cls');
  building(-56,20,26,13,9,MT.wA,MT.roofR,'Building H',2,'cls');
  building(-18,20,22,13,9,MT.wA,MT.roofR,'Building I',2,'cls');

  prog(66, 'Flagpole and pool...');
  flagpole(-6,-92);

  // Pool - pool walls are solid (can't walk into water)
  solidBox(24,0.38,17,MT.ptl,36,0,-46);
  solidBox(0.3,1.2,17,MT.ptl,36-12,0,-46); // left wall
  solidBox(0.3,1.2,17,MT.ptl,36+12,0,-46); // right wall
  solidBox(24,1.2,0.3,MT.ptl,36,0,-46-8.5); // back wall
  solidBox(24,1.2,0.3,MT.ptl,36,0,-46+8.5); // front wall
  var poolMesh = visBox(20,0.22,13,MT.pool,36,0.55,-46,true);
  // Pool caustic animation variable (used in loop)
  var poolTime = 0; // water visual
  for(var ln=-5;ln<=5;ln+=2.5) visBox(20,0.14,0.15,mk(0xff6020,0.7),36,0.56,-46+ln,true);
  addSurf(36,-46,24,17,0.38); // pool deck surface
  mkLabel('Aquatics Center',10).position.set(36,5,-46);
  NPCS.push({x:36,z:-46,radius:5,label:'Aquatics Center',msg:'8-lane competition pool. You cannot enter the water for safety reasons!'});
  ZONES.push({x1:24,x2:48,z1:-55,z2:-37,name:'Aquatics Center'});

  prog(70, 'Tennis courts...');
  var tcx=[-27,0,27];
  for(var ti=0;ti<tcx.length;ti++){
    var tx=-112+tcx[ti];
    solidBox(24,0.1,52,MT.ten,tx,0,52);
    addSurf(tx,52,24,52,0.1);
    visBox(0.13,0.12,52,MT.tln,tx-11,0.1,52,true); visBox(0.13,0.12,52,MT.tln,tx+11,0.1,52,true);
    visBox(24,0.1,0.13,MT.tln,tx,0.1,26,true); visBox(24,0.1,0.13,MT.tln,tx,0.1,52,true); visBox(24,0.1,0.13,MT.tln,tx,0.1,78,true);
    solidBox(24,1.1,0.12,mk(0xeeeeee,0.5),tx,0,52); // NET is solid
  }
  mkLabel('Tennis Courts',10).position.set(-112,5,52);
  NPCS.push({x:-112,z:52,radius:7,label:'Tennis Courts',msg:'3 hard courts - MVHS Tennis. The nets are solid so you cannot run through them!'});
  ZONES.push({x1:-130,x2:-86,z1:26,z2:78,name:'Tennis Courts'});

  prog(76, 'Track and football field...');
  stripes(-82,102,82,104,MT.trkI,MT.stp,8);
  oval(-82,102,58,64,11,0.14,MT.track);
  oval(-82,102,45,51,1.5,0.15,mk(0xffffff,0.9));
  visBox(0.28,0.14,104,MT.tln,-82,0.07,102,true); visBox(82,0.14,0.28,MT.tln,-82,0.07,102,true);
  visBox(14,0.14,0.28,MT.tln,-82,0.07,56,true); visBox(14,0.14,0.28,MT.tln,-82,0.07,148,true);
  visBox(82,0.07,10,mk(0x3a5aaa,0.6),-82,0.07,52,true); visBox(82,0.07,10,mk(0x3a5aaa,0.6),-82,0.07,152,true);
  // Bleachers (all solid rows)
  bleachers(-82,70,65,8,0);
  bleachers(-82,134,65,8,Math.PI);
  bleachers(-122,102,65,6,Math.PI/2);
  // Goal posts (solid)
  solidBox(0.3,5.5,0.3,mk(0xffdd00,0.6,0.3),-78,0,57); solidBox(0.3,5.5,0.3,mk(0xffdd00,0.6,0.3),-86,0,57);
  solidBox(0.3,5.5,0.3,mk(0xffdd00,0.6,0.3),-78,0,147); solidBox(0.3,5.5,0.3,mk(0xffdd00,0.6,0.3),-86,0,147);
  var tlps=[[-32,64],[-132,64],[-32,140],[-132,140]]; for(var tli=0;tli<tlps.length;tli++) lpole(tlps[tli][0],tlps[tli][1]);
  mkLabel('Football Field + Track',13).position.set(-82,7,102);
  NPCS.push({x:-82,z:102,radius:9,label:'Football Field + Track',msg:'400m all-weather track with football field. Bleachers are fully climbable - walk up each row!'});
  ZONES.push({x1:-145,x2:-22,z1:62,z2:162,name:'Football Field + Track'});

  prog(83, 'Baseball field...');
  stripes(52,112,92,92,MT.trkI,MT.stp,8);
  solidBox(44,0.12,44,MT.dirt,52,0,126); addSurf(52,126,44,44,0.12);
  visBox(1.2,0.22,1.2,MT.base,52,0.12,146,true); visBox(1.2,0.22,1.2,MT.base,74,0.12,126,true);
  visBox(1.2,0.22,1.2,MT.base,52,0.12,106,true); visBox(1.2,0.22,1.2,MT.base,30,0.12,126,true);
  visCyl(1.6,2,0.6,12,MT.mnd,52,0.3,126);
  addSurf(52,126,3.2,3.2,0.6); // stand on the mound
  visBox(0.18,0.12,52,MT.tln,72,0.07,102,true); visBox(0.18,0.12,52,MT.tln,32,0.07,102,true);
  solidBox(14,2.1,4.5,mk(0xaaaaaa),40,0,151); solidBox(14,2.1,4.5,mk(0xaaaaaa),64,0,151); // dugouts
  solidBox(10,7,1,MT.scr,52,0,86); visBox(9,6,0.1,MT.eG,52,3.5,85.6,true); // scoreboard
  solidBox(0.5,20,0.5,MT.pol,32,0,88); visBox(8,0.5,1.5,MT.pol,32,20,88); visBox(7,0.3,1.2,MT.eL,32,20.3,88,true);
  solidBox(0.5,20,0.5,MT.pol,72,0,88); visBox(8,0.5,1.5,MT.pol,72,20,88); visBox(7,0.3,1.2,MT.eL,72,20.3,88,true);
  mkLabel('Baseball Field',11).position.set(52,7,112);
  NPCS.push({x:52,z:112,radius:8,label:'Baseball Field',msg:'MVHS Baseball - CCS Div II. Stand on the mound! Dugouts along the baselines.'});
  ZONES.push({x1:6,x2:100,z1:66,z2:158,name:'Baseball Field'});

  prog(89, 'Field hockey...');
  stripes(112,102,66,92,MT.trkI,MT.stp,6);
  solidBox(66,0.1,92,MT.ten,112,0,102); addSurf(112,102,66,92,0.1); // turf surface
  visBox(0.18,0.12,92,MT.tln,79,0.12,102,true); visBox(0.18,0.12,92,MT.tln,145,0.12,102,true);
  visBox(66,0.12,0.18,MT.tln,112,0.12,56,true); visBox(66,0.12,0.18,MT.tln,112,0.12,148,true); visBox(66,0.12,0.18,MT.tln,112,0.12,102,true);
  [56,148].forEach(function(gz){
    solidBox(8,2.5,0.2,mk(0xffffff),112,0,gz);
    solidBox(0.2,2.5,3,mk(0xffffff),108,0,gz); solidBox(0.2,2.5,3,mk(0xffffff),116,0,gz);
  });
  mkLabel('Field Hockey',10).position.set(112,5,102);
  NPCS.push({x:112,z:102,radius:7,label:'Field Hockey',msg:'MVHS Field Hockey - regulation turf. Goals at both ends - you cannot walk through them!'});
  ZONES.push({x1:79,x2:145,z1:56,z2:150,name:'Field Hockey Field'});

  prog(93, 'Trees...');
  var tp=[
    [-144,-86],[-144,-66],[-144,-46],[-144,-26],[-144,-6],[-144,14],[-144,34],[-144,54],
    [144,-86],[144,-66],[144,-46],[144,-26],[144,-6],[144,14],[144,34],
    [-102,-92],[-72,-92],[-42,-92],[-12,-92],[18,-92],[48,-92],[78,-92],
    [-90,-86],[-116,-86],[-90,66],[-116,66],
    [-62,-16],[-6,-62],[34,-22],[62,30],[-42,34],[22,34],
    [-148,55],[-148,82],[-148,122],[-148,142],
    [9,58],[9,142],[2,100],[94,58],[94,142],[96,100],
    [155,55],[155,102],[155,145],[-24,0],[24,0],[-24,-20],[24,-20],
    [-5,-92],[30,-92],[60,-92],[-50,-92]
  ];
  for(var ti2=0;ti2<tp.length;ti2++) tree(tp[ti2][0],tp[ti2][1],0.85+Math.random()*0.55);

  // Quad paving area (courtyard between buildings)
  visBox(44, 0.08, 20, MT.side, 10, 0.04, -42, true);
  // Central path strips
  visBox(2, 0.09, 180, MT.side, 0, 0.045, 0, true);
  visBox(160, 0.09, 2, MT.side, 0, 0.045, -42, true);
  // Benches along paths
  var benchSpots = [[-15,-42],[15,-42],[0,-55],[0,-30],[-30,10],[30,10]];
  for (var bi3=0;bi3<benchSpots.length;bi3++) {
    var bspx=benchSpots[bi3][0], bspz=benchSpots[bi3][1];
    solidBox(2.8, 0.45, 0.55, mk(0xc09050,0.7), bspx, 0, bspz);
    solidBox(2.8, 0.08, 0.5, mk(0xaa7840,0.6), bspx, 0.45, bspz);
    solidBox(0.1, 0.55, 0.55, mk(0x888888,0.5,0.3), bspx-1.3, 0, bspz);
    solidBox(0.1, 0.55, 0.55, mk(0x888888,0.5,0.3), bspx+1.3, 0, bspz);
  }
  // Bike racks near front
  for (var rkx = -20; rkx <= 20; rkx += 10) {
    solidBox(0.06, 0.9, 3.5, mk(0xaaaaaa,0.4,0.5), rkx, 0, -88);
    for (var rki=0;rki<4;rki++) solidBox(0.06,0.88,0.06,mk(0xaaaaaa,0.4,0.5),rkx,0.44,-89.5+rki);
  }

  prog(97, 'Campus boundary...');
  // Campus boundary walls (solid - can't leave campus)
  solidBox(300,3,0.5,mk(0x888888,0.9),0,0,-91); // north
  solidBox(300,3,0.5,mk(0x888888,0.9),0,0,157);  // south
  solidBox(0.5,3,250,mk(0x888888,0.9),-149,0,30); // west
  solidBox(0.5,3,250,mk(0x888888,0.9),149,0,30);  // east

  // ── FRESHMAN ZONE BARRIERS ─────────────────────────────────
  // Corner post / restriction sign
  var rSign1 = mkLabel('SENIORS & JUNIORS ONLY', 8);
  rSign1.position.set(-64, 3.5, -55);
  var rSign2 = mkLabel('— SENIORS & JUNIORS ONLY —', 8);
  rSign2.position.set(-100, 3.5, -23);
  // Orange traffic cones at boundary corners for visibility
  function cone(cx, cz) {
    visCyl(0, 0.15, 0.65, 8, mk(0xff6600, 0.6), cx, 0.325, cz);
    visCyl(0.18, 0.05, 0.08, 8, mk(0xffffff, 0.7), cx, 0.7, cz);
  }
  cone(-64, -22); cone(-64, -40); cone(-64, -85);
  cone(-138, -23); cone(-100, -23); cone(-80, -23);

  prog(100, 'Done!');
  setTimeout(function() { var l=document.getElementById('w3d-load'); if(l) l.style.display='none'; }, 280);

  // ============================================================
  // PLAYER STATE
  // ============================================================
  var PH = 1.75; // player height (camera from ground)
  var PR = 0.32; // player radius

  var px = -66, py = PH, pz = -62; // spawn just outside east gym entrance
  var velY = 0, onGnd = true;
  var yaw = -Math.PI / 2, pitch = 0; // facing west toward gym east wall door
  var orientationTriggered = false;
  var jcd = 0;
  var keys = {};
  var sprintOn = false, sprintCooldown = 0;

  // Club fair / commitment system
  var clubMeetingTimer      = 0;
  var CLUB_MEETING_INTERVAL = 180;
  var _cfProxTimer = 0, _cfProxType = null; // 1.5s buffer before triggering booth
  var fullMapOpen = false;

  CAM.position.set(px, py, pz);
  window.addEventListener('keydown', function(e) {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
    if (e.code === 'KeyE') doInfo();
    if (e.code === 'KeyF') toggleDoor();
    if (e.code === 'KeyM') {
      fullMapOpen = !fullMapOpen;
      var fmEl = document.getElementById('fullmap-overlay');
      if (fmEl) {
        if (fullMapOpen) {
          fmEl.style.display = 'flex';
          requestAnimationFrame(drawFullMap);
        } else {
          fmEl.style.display = 'none';
          if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
        }
      }
    }
    // P key is handled entirely by game.js _togglePause() to avoid double-firing
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      e.preventDefault();
      if (!sprintOn && sprintCooldown <= 0) {
        sprintOn = true;
        showN('Sprint ON  (press Shift again to stop)');
      } else if (sprintOn) {
        sprintOn = false;
        sprintCooldown = 5;
        showN('Sprint OFF  — cooldown 5s');
      }
    }
    if (e.code === 'Escape' && fullMapOpen) {
      fullMapOpen = false;
      var fmEl2 = document.getElementById('fullmap-overlay');
      if (fmEl2) fmEl2.style.display = 'none';
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock();
    }
  });
  window.addEventListener('keyup', function(e) { keys[e.code] = false; });

  // Pointer lock
  var locked = false;
  canvas.addEventListener('click', function() { if (!locked) canvas.requestPointerLock(); });
  document.addEventListener('pointerlockchange', function() {
    locked = document.pointerLockElement === canvas;
    var hint = document.getElementById('lock-hint');
    if (hint) hint.style.display = locked ? 'none' : 'block';
  });
  document.addEventListener('mousemove', function(e) {
    if (!locked) return;
    yaw   -= e.movementX * 0.002;
    pitch -= e.movementY * 0.002;
    pitch  = Math.max(-1.3, Math.min(1.3, pitch));
  });

  // ============================================================
  // INTERACTION
  // ============================================================
  var ntimer = 0;
  function showN(msg) {
    var el = document.getElementById('notif');
    el.textContent = msg;
    el.style.display = 'block';
    ntimer = 9.0; // long enough to read comfortably
  }
  // Expose for cross-file use (game.js club fair hints, etc.)
  window.MYTH_SHOW_NOTIF = showN;

  function doInfo() {
    var best = null, bestD = Infinity;
    for (var i = 0; i < NPCS.length; i++) {
      var n = NPCS[i];
      var dx = px - n.x, dz = pz - n.z;
      var d = Math.sqrt(dx*dx + dz*dz);
      if (d < n.radius && d < bestD) { best = n; bestD = d; }
    }
    if (best) showN(best.msg);
    else showN('Nothing nearby. Walk up to a building, field, or landmark and press E.');
  }

  var _doorWP = new THREE.Vector3();
  function toggleDoor() {
    var best = null, bestD = Infinity;
    for (var i = 0; i < DOORS.length; i++) {
      var dr = DOORS[i];
      dr.mesh.getWorldPosition(_doorWP);
      var wp = _doorWP;
      var dx = px - wp.x, dz = pz - wp.z;
      var d = Math.sqrt(dx*dx + dz*dz);
      if (d < 7 && d < bestD) { best = dr; bestD = d; }
    }
    if (best) {
      best.open = !best.open;
      if (best.open) {
        if (best.wallAxis === 'x') {
          // East/west wall door — swing along wall (Z direction)
          best.mesh.position.x = best.cx;
          best.mesh.position.z = best.cz - 1.55;
          best.mesh.rotation.y = Math.PI / 2;
        } else {
          best.mesh.position.x = best.cx - 1.5;
          best.mesh.position.z = best.cz - 1.4;
          best.mesh.rotation.y = -Math.PI / 2;
        }
        if (best.col) best.col.makeEmpty();
      } else {
        best.mesh.position.x = best.cx;
        best.mesh.position.z = best.cz;
        best.mesh.rotation.y = 0;
        if (best.col && best.origMin) best.col.set(best.origMin, best.origMax);
      }
      showN(best.open ? 'Door opened — walk inside!' : 'Door closed.');
    } else {
      showN('No door nearby. Walk up to a building entrance and press F.');
    }
  }

  // ============================================================
  // PHYSICS - proper swept AABB
  // ============================================================
  var playerBox = new THREE.Box3(); // updated every frame

  // Pre-allocated vectors for sweepMove — avoids GC pressure every frame
  var _sweepPMin = new THREE.Vector3();
  var _sweepPMax = new THREE.Vector3();

  function getSurfaceY(nx, nz) {
    // Find the highest walkable surface beneath the player
    var topY = -Infinity;
    for (var i = 0; i < SURFS.length; i++) {
      var s = SURFS[i];
      var b = s.box;
      if (nx >= b.min.x - PR && nx <= b.max.x + PR &&
          nz >= b.min.z - PR && nz <= b.max.z + PR) {
        // Surface must be at or below current feet + step-up height
        if (s.topY <= py + 0.85 && s.topY > topY) {
          topY = s.topY;
        }
      }
    }
    return topY === -Infinity ? 0 : topY;
  }

  function sweepMove(nx, ny, nz) {
    var halfW = PR, halfH = PH;
    _sweepPMin.set(nx - halfW, ny - halfH, nz - halfW);
    _sweepPMax.set(nx + halfW, ny + 0.1,   nz + halfW);

    var i, col, ox, oy, oz;
    for (i = 0; i < COLS.length; i++) {
      col = COLS[i];
      if (col.isEmpty()) continue;
      if (_sweepPMax.x <= col.min.x || _sweepPMin.x >= col.max.x) continue;
      if (_sweepPMax.y <= col.min.y || _sweepPMin.y >= col.max.y) continue;
      if (_sweepPMax.z <= col.min.z || _sweepPMin.z >= col.max.z) continue;
      ox = Math.min(_sweepPMax.x - col.min.x, col.max.x - _sweepPMin.x);
      oy = Math.min(_sweepPMax.y - col.min.y, col.max.y - _sweepPMin.y);
      oz = Math.min(_sweepPMax.z - col.min.z, col.max.z - _sweepPMin.z);
      if (oy < ox && oy < oz) continue;
      if (ox < oz) {
        if (nx < (col.min.x + col.max.x) / 2) nx -= ox + 0.001;
        else nx += ox + 0.001;
      } else {
        if (nz < (col.min.z + col.max.z) / 2) nz -= oz + 0.001;
        else nz += oz + 0.001;
      }
      _sweepPMin.set(nx - halfW, ny - halfH, nz - halfW);
      _sweepPMax.set(nx + halfW, ny + 0.1,   nz + halfW);
    }

    // Closed door colliders (processed separately to avoid array allocation)
    for (var j = 0; j < DOORS.length; j++) {
      if (!DOORS[j].open && DOORS[j].col && !DOORS[j].col.isEmpty()) {
        col = DOORS[j].col;
        if (_sweepPMax.x <= col.min.x || _sweepPMin.x >= col.max.x) continue;
        if (_sweepPMax.y <= col.min.y || _sweepPMin.y >= col.max.y) continue;
        if (_sweepPMax.z <= col.min.z || _sweepPMin.z >= col.max.z) continue;
        ox = Math.min(_sweepPMax.x - col.min.x, col.max.x - _sweepPMin.x);
        oy = Math.min(_sweepPMax.y - col.min.y, col.max.y - _sweepPMin.y);
        oz = Math.min(_sweepPMax.z - col.min.z, col.max.z - _sweepPMin.z);
        if (oy < ox && oy < oz) continue;
        if (ox < oz) {
          if (nx < (col.min.x + col.max.x) / 2) nx -= ox + 0.001;
          else nx += ox + 0.001;
        } else {
          if (nz < (col.min.z + col.max.z) / 2) nz -= oz + 0.001;
          else nz += oz + 0.001;
        }
        _sweepPMin.set(nx - halfW, ny - halfH, nz - halfW);
        _sweepPMax.set(nx + halfW, ny + 0.1,   nz + halfW);
      }
    }

    return { x: nx, y: ny, z: nz };
  }

  // ============================================================
  // ZONE + MINIMAP
  // ============================================================
  function getZone() {
    for (var i = 0; i < ZONES.length; i++) {
      var z = ZONES[i];
      if (px >= z.x1 && px <= z.x2 && pz >= z.z1 && pz <= z.z2) return z.name;
    }
    return 'MVHS Campus';
  }

  var mmCtx = document.getElementById('mm').getContext('2d');

  // ── Shared map drawing helper — used by both minimap and full-screen map ──
  // drawMapScene(ctx, canvasW, canvasH, centerX, centerZ, scale)
  // scale: world-units per pixel (larger = zoomed out)
  function _drawMapScene(ctx, cW, cH, cX, cZ, sc, showLabels) {
    var ox = cW / 2 - (cX) * sc;
    var oz = cH / 2 - (cZ) * sc;
    function wx(worldX) { return Math.round(ox + worldX * sc); }
    function wz(worldZ) { return Math.round(oz + worldZ * sc); }
    function wr(x, z, w, d, col) {
      ctx.fillStyle = col;
      ctx.fillRect(wx(x), wz(z), Math.max(1, Math.round(w * sc)), Math.max(1, Math.round(d * sc)));
    }
    function wl(x1, z1, x2, z2, col, lw) {
      ctx.strokeStyle = col; ctx.lineWidth = lw || 1;
      ctx.beginPath(); ctx.moveTo(wx(x1), wz(z1)); ctx.lineTo(wx(x2), wz(z2)); ctx.stroke();
    }
    function wlabel(txt, x, z, col, sz) {
      if (!showLabels) return;
      ctx.fillStyle = col || 'rgba(255,240,180,0.9)';
      ctx.font = 'bold ' + (sz || 10) + 'px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(txt, wx(x), wz(z));
    }

    // Grass base
    wr(-148, -95, 296, 260, '#1e3d20');
    // Courtyards / paved areas
    wr(-138, -85, 74, 90, '#3a352e');
    wr(-64,  -85, 210, 250, '#2e2a24');
    // Paths
    wr(-138, -2,  74,  80, '#4a453e');
    wr(-64, -93, 210, 42, '#4a453e');

    // Sports fields (green)
    wr(-138, 66, 92, 92, '#2a6038'); wr(6, 66, 92, 92, '#2a6038'); wr(79, 56, 66, 92, '#2a6038');
    wlabel('SOCCER FIELD', -92, 112, '#6edd80', 9);
    wlabel('BASEBALL',      52, 112, '#6edd80', 9);
    wlabel('TENNIS',       112,  88, '#6edd80', 9);

    // Track oval
    ctx.strokeStyle = '#4caa60'; ctx.lineWidth = Math.max(2, 4 * sc);
    ctx.beginPath();
    ctx.ellipse(wx(-82), wz(102), Math.max(3, 58 * sc), Math.max(3, 64 * sc), 0, 0, Math.PI * 2);
    ctx.stroke();
    wlabel('TRACK', -82, 102, '#6edd80', 10);

    // Trees
    wr(-128, 26, 42, 52, '#2d6635');

    // Pool / Aquatics Center
    wr(24, -54.5, 24, 17, '#1864a8');
    wlabel('POOL', 36, -46, '#62c4f0', 9);

    // ── Buildings — positions match actual building() / buildGym() / IIFE calls ──
    // Gym  (buildGym(-92,-62), w=42, d=32)
    wr(-113, -78, 42, 32, '#8a3030');
    wlabel('GYM', -92, -62, '#ffaaaa', 10);
    // Bio / Robotics Lab  (bx=-97,bz=-36,bw=22,bd=14)
    wr(-108, -43, 22, 14, '#2a5a8a');
    wlabel('BIO', -97, -36, '#a0c8ff', 8);
    // Weight Room  (building(-92,-12,22,13))
    wr(-103, -18.5, 22, 13, '#604040');
    wlabel('WEIGHTS', -92, -12, '#e0aaaa', 8);

    // North academic row: Admin A, Bldg B, Bldg D  (z=-74)
    wr(-47, -81.5, 30, 15, '#3a6090'); wlabel('ADMIN',   -32, -74, '#a0c8ff', 8);
    wr(-1,  -81.5, 26, 15, '#3a6090'); wlabel('BLDG B',   12, -74, '#a0c8ff', 8);
    wr(37,  -81.5, 26, 15, '#3a6090'); wlabel('BLDG D',   50, -74, '#a0c8ff', 8);
    // Mid academic row: Bldg C, Science E  (z=-54)
    wr(-45, -60.5, 26, 13, '#3a6090'); wlabel('BLDG C',  -32, -54, '#a0c8ff', 8);
    wr(0,   -60.5, 24, 13, '#4a7098'); wlabel('SCIENCE',  12, -54, '#a0c8ff', 8);
    // F Buildings — 5 units at fbx=[-72,-44,-14,16,44], z=-32, 18×13
    var _fbx2 = [-72,-44,-14,16,44];
    for (var _fi2 = 0; _fi2 < 5; _fi2++) {
      wr(_fbx2[_fi2]-9, -38.5, 18, 13, '#3a6090');
      wlabel('F'+(_fi2+1), _fbx2[_fi2], -32, '#a0c8ff', 7);
    }
    // Library (76,-56,24,17) + Physics (76,-32,24,15)
    wr(64, -64.5, 24, 17, '#806020'); wlabel('LIBRARY', 76, -56, '#f0d070', 9);
    wr(64, -39.5, 24, 15, '#806020'); wlabel('PHYSICS', 76, -32, '#f0d070', 9);
    // Cafeteria (0,-10,40,24)
    wr(-20, -22, 40, 24, '#704a20'); wlabel('CAFETERIA', 0, -10, '#f0c070', 10);
    // Theater (52,-10,22,17)  + Building G (82,-10,18,15)
    wr(41, -18.5, 22, 17, '#504020'); wlabel('THEATER', 52, -10, '#f0d080', 9);
    wr(73, -17.5, 18, 15, '#3a6090'); wlabel('BLDG G',  82, -10, '#a0c8ff', 8);
    // Buildings H (-56,20,26,13) and I (-18,20,22,13)
    wr(-69, 13.5, 26, 13, '#3a6090'); wlabel('BLDG H', -56, 20, '#a0c8ff', 8);
    wr(-29, 13.5, 22, 13, '#3a6090'); wlabel('BLDG I', -18, 20, '#a0c8ff', 8);

    // Club fair marker
    if (!window.MYTH_CLUB_CHOICE && Engine && Engine.hasFlag && Engine.hasFlag('orientation_complete')) {
      ctx.fillStyle = 'rgba(255,220,50,0.4)';
      ctx.fillRect(wx(-140), wz(-42), Math.round(32 * sc), Math.round(16 * sc));
      ctx.strokeStyle = 'rgba(255,220,50,0.8)'; ctx.lineWidth = 1;
      ctx.strokeRect(wx(-140), wz(-42), Math.round(32 * sc), Math.round(16 * sc));
      wlabel('CLUB FAIR ★', -124, -34, '#ffd030', 9);
    }

    // Player dot + direction arrow
    var pdx = wx(px), pdz = wz(pz);
    // Glow
    ctx.fillStyle = 'rgba(255,220,80,0.25)';
    ctx.beginPath(); ctx.arc(pdx, pdz, Math.max(6, 12 * sc), 0, Math.PI * 2); ctx.fill();
    // Dot
    ctx.fillStyle = '#ffe040';
    ctx.beginPath(); ctx.arc(pdx, pdz, Math.max(3, 5 * sc), 0, Math.PI * 2); ctx.fill();
    // Direction arrow
    var arLen = Math.max(10, 18 * sc);
    ctx.strokeStyle = '#ffe040'; ctx.lineWidth = Math.max(1.5, 2.5 * sc);
    ctx.beginPath();
    ctx.moveTo(pdx, pdz);
    ctx.lineTo(pdx + Math.sin(yaw) * arLen, pdz - Math.cos(yaw) * arLen);
    ctx.stroke();
    // Arrow head
    ctx.fillStyle = '#ffe040';
    ctx.beginPath();
    var ahx = pdx + Math.sin(yaw) * arLen;
    var ahz = pdz - Math.cos(yaw) * arLen;
    ctx.moveTo(ahx, ahz);
    ctx.lineTo(ahx - Math.sin(yaw - 2.4) * arLen * 0.3, ahz + Math.cos(yaw - 2.4) * arLen * 0.3);
    ctx.lineTo(ahx - Math.sin(yaw + 2.4) * arLen * 0.3, ahz + Math.cos(yaw + 2.4) * arLen * 0.3);
    ctx.closePath(); ctx.fill();

    // ── Destination highlights ──
    var _hlNow = Date.now();
    var _hlPulse = 0.5 + 0.5 * Math.sin(_hlNow * 0.0045);

    // Highlight bio building (club fair done, bio not yet triggered)
    if (window.MYTH_CLUB_CHOICE !== null && window.MYTH_CLUB_CHOICE !== undefined &&
        !window.MYTH_BIO_TRIGGERED) {
      ctx.strokeStyle = 'rgba(100,255,120,' + (0.5 + 0.3 * _hlPulse).toFixed(2) + ')';
      ctx.lineWidth = Math.max(1.5, 2 * sc);
      ctx.beginPath(); ctx.arc(wx(-97), wz(-36), Math.max(5, (13 + 2 * _hlPulse) * sc), 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(100,255,120,' + (0.07 + 0.05 * _hlPulse).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(wx(-97), wz(-36), Math.max(5, 13 * sc), 0, Math.PI * 2); ctx.fill();
    }
    // Highlight gym (PE) after bio done
    if (window.MYTH_BIO_DONE && !window.MYTH_PE_TRIGGERED) {
      ctx.strokeStyle = 'rgba(255,160,60,' + (0.5 + 0.3 * _hlPulse).toFixed(2) + ')';
      ctx.lineWidth = Math.max(1.5, 2 * sc);
      ctx.beginPath(); ctx.arc(wx(-92), wz(-62), Math.max(5, (20 + 3 * _hlPulse) * sc), 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,160,60,' + (0.07 + 0.05 * _hlPulse).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(wx(-92), wz(-62), Math.max(5, 20 * sc), 0, Math.PI * 2); ctx.fill();
    }
    // Highlight EC/class nav target (sophomore year)
    if (window.MYTH_SOPH_NAV_TARGET) {
      var _snt = window.MYTH_SOPH_NAV_TARGET;
      var _tr  = Math.max(4, _snt.r * sc);
      // Outer pulsing ring
      ctx.strokeStyle = 'rgba(80,220,255,' + (0.35 + 0.3 * _hlPulse).toFixed(2) + ')';
      ctx.lineWidth = Math.max(1.5, 3 * sc);
      ctx.beginPath(); ctx.arc(wx(_snt.x), wz(_snt.z), _tr + (3 * _hlPulse * sc || 2), 0, Math.PI * 2); ctx.stroke();
      // Inner solid ring
      ctx.strokeStyle = 'rgba(160,240,255,' + (0.65 + 0.3 * _hlPulse).toFixed(2) + ')';
      ctx.lineWidth = Math.max(1, 2 * sc);
      ctx.beginPath(); ctx.arc(wx(_snt.x), wz(_snt.z), _tr, 0, Math.PI * 2); ctx.stroke();
      // Fill tint
      ctx.fillStyle = 'rgba(80,220,255,' + (0.07 + 0.05 * _hlPulse).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(wx(_snt.x), wz(_snt.z), _tr, 0, Math.PI * 2); ctx.fill();
      // Label (full map only — too small on minimap)
      if (showLabels) {
        ctx.fillStyle = 'rgba(160,240,255,0.9)';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('★ GO HERE', wx(_snt.x), wz(_snt.z) - _tr - 4);
      }
    }
  }

  function drawMM() {
    var mmSz = 170;
    var mmCv = document.getElementById('mm');
    if (mmCv.width !== mmSz || mmCv.height !== mmSz) { mmCv.width = mmSz; mmCv.height = mmSz; }
    mmCtx.clearRect(0, 0, mmSz, mmSz);
    // Circular clip
    mmCtx.save();
    mmCtx.beginPath(); mmCtx.arc(mmSz/2, mmSz/2, mmSz/2 - 1, 0, Math.PI*2); mmCtx.clip();
    mmCtx.fillStyle = '#0a1520'; mmCtx.fillRect(0, 0, mmSz, mmSz);
    // Draw map centered on player; scale = 0.4 px per world unit (tight radius)
    _drawMapScene(mmCtx, mmSz, mmSz, px, pz, 0.4, false);
    mmCtx.restore();

    // ── Navigation arrows: show when MYTH_SOPH_NAV_TARGET is active ──
    if (window.MYTH_SOPH_NAV_TARGET) {
      var _snt2 = window.MYTH_SOPH_NAV_TARGET;
      // Direction from player to target (in minimap pixel space)
      var _tdx = _snt2.x - px, _tdz = _snt2.z - pz;
      var _dist = Math.sqrt(_tdx*_tdx + _tdz*_tdz);
      if (_dist > _snt2.r) {
        // Angle toward target
        var _ang = Math.atan2(_tdx, -_tdz); // screen angle: right=east, up=north
        // Convert to minimap scale (0.4 px/unit) — clamp arrow to circle boundary
        var _mxT = _snt2.x, _mzT = _snt2.z;
        var _sc2 = 0.4;
        var _cpx = mmSz/2 + (_mxT - px) * _sc2, _cpz = mmSz/2 + (_mzT - pz) * _sc2;
        // If target dot is within minimap, draw a pulsing dot on it
        var _mmRad = mmSz/2 - 4;
        var _tdpx = _cpx - mmSz/2, _tdpz = _cpz - mmSz/2;
        var _inMap = Math.sqrt(_tdpx*_tdpx + _tdpz*_tdpz) < _mmRad;
        mmCtx.save();
        mmCtx.beginPath(); mmCtx.arc(mmSz/2, mmSz/2, mmSz/2 - 1, 0, Math.PI*2); mmCtx.clip();
        if (_inMap) {
          // Target dot (pulsing)
          var _pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.006);
          mmCtx.fillStyle = 'rgba(100,220,255,' + (0.55 + 0.4 * _pulse).toFixed(2) + ')';
          mmCtx.beginPath(); mmCtx.arc(_cpx, _cpz, 5, 0, Math.PI*2); mmCtx.fill();
          mmCtx.strokeStyle = 'rgba(160,240,255,0.9)'; mmCtx.lineWidth = 1.5;
          mmCtx.beginPath(); mmCtx.arc(_cpx, _cpz, 5 + 3 * _pulse, 0, Math.PI*2); mmCtx.stroke();
        } else {
          // Arrow at edge of minimap circle pointing toward target
          var _edgeX = mmSz/2 + Math.sin(_ang) * (_mmRad - 8);
          var _edgeZ = mmSz/2 - Math.cos(_ang) * (_mmRad - 8);
          var _aLen = 9, _aW = 5;
          mmCtx.save();
          mmCtx.translate(_edgeX, _edgeZ);
          mmCtx.rotate(_ang);
          mmCtx.globalAlpha = 0.82;
          mmCtx.fillStyle = '#64dcff';
          mmCtx.beginPath();
          mmCtx.moveTo(0, -_aLen);
          mmCtx.lineTo(-_aW, _aLen * 0.3);
          mmCtx.lineTo(0,  _aLen * 0.0);
          mmCtx.lineTo(_aW, _aLen * 0.3);
          mmCtx.closePath();
          mmCtx.fill();
          mmCtx.strokeStyle = 'rgba(255,255,255,0.55)'; mmCtx.lineWidth = 0.8;
          mmCtx.stroke();
          mmCtx.restore();
        }
        // Distance label at the edge arrow
        if (!_inMap) {
          var _distLblX = mmSz/2 + Math.sin(_ang) * (_mmRad - 20);
          var _distLblZ = mmSz/2 - Math.cos(_ang) * (_mmRad - 20);
          mmCtx.fillStyle = 'rgba(100,220,255,0.85)';
          mmCtx.font = 'bold 7px monospace';
          mmCtx.textAlign = 'center';
          mmCtx.fillText(Math.round(_dist) + 'm', _distLblX, _distLblZ + 3);
        }
        mmCtx.restore();
      }
    }

    // North label
    mmCtx.fillStyle = 'rgba(232,208,112,0.8)'; mmCtx.font = 'bold 8px monospace';
    mmCtx.textAlign = 'center'; mmCtx.fillText('N', mmSz/2, 11);
    // Map key hint
    mmCtx.fillStyle = 'rgba(200,180,100,0.5)'; mmCtx.font = '7px monospace';
    mmCtx.textAlign = 'center'; mmCtx.fillText('[M] MAP', mmSz/2, mmSz - 4);
    // Border ring
    mmCtx.strokeStyle = 'rgba(200,180,100,0.4)'; mmCtx.lineWidth = 1.5;
    mmCtx.beginPath(); mmCtx.arc(mmSz/2, mmSz/2, mmSz/2 - 1, 0, Math.PI*2); mmCtx.stroke();
  }

  // ── Full-screen map (M key) ──────────────────────────────────────────────
  function drawFullMap() {
    if (!fullMapOpen) return;
    var fmCv = document.getElementById('fullmap-canvas');
    if (!fmCv) return;
    // Match canvas resolution to actual display pixels
    if (fmCv.width !== window.innerWidth || fmCv.height !== window.innerHeight) {
      fmCv.width  = window.innerWidth;
      fmCv.height = window.innerHeight;
    }
    var W = fmCv.width, H = fmCv.height;
    var ctx = fmCv.getContext('2d');

    // Background
    ctx.fillStyle = '#080e1a';
    ctx.fillRect(0, 0, W, H);

    // Campus title
    ctx.fillStyle = 'rgba(232,208,112,0.9)';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MONTA VISTA HIGH SCHOOL — CAMPUS MAP', W/2, 36);
    ctx.fillStyle = 'rgba(180,160,90,0.5)';
    ctx.font = '11px monospace';
    ctx.fillText('CUPERTINO, CA  ·  Press M or ESC to close', W/2, 54);

    // Grid lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H); ctx.stroke(); }
    for (var gz = 0; gz < H; gz += 40) { ctx.beginPath(); ctx.moveTo(0,gz); ctx.lineTo(W,gz); ctx.stroke(); }

    // Map area: world bounds -148..145 (X) and -95..165 (Z)
    var mapPad = 80;
    var mapW = W - mapPad * 2;
    var mapH = H - mapPad * 2 - 100; // leave bottom for legend
    // Scale to fit world
    var worldW = 293, worldH = 260;
    var scX = mapW / worldW, scZ = mapH / worldH;
    var sc  = Math.min(scX, scZ);
    // Center in available area
    var mapOX = mapPad + (mapW - worldW * sc) / 2;
    var mapOZ = mapPad + 60 + (mapH - worldH * sc) / 2;

    // Campus border
    ctx.strokeStyle = 'rgba(200,180,100,0.3)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(mapOX, mapOZ, worldW * sc, worldH * sc);

    // Draw map scene centered at world origin (-148, -95) → (0, 0) on canvas
    ctx.save();
    ctx.beginPath();
    ctx.rect(mapOX - 2, mapOZ - 2, worldW * sc + 4, worldH * sc + 4);
    ctx.clip();
    // Transform: world pos (wx, wz) → canvas (mapOX + (wx - (-148)) * sc, mapOZ + (wz - (-95)) * sc)
    // = mapOX + (wx + 148) * sc, mapOZ + (wz + 95) * sc
    // We use _drawMapScene with cX=-148+W_logical/2, cZ=-95+H_logical/2 so the world origin maps right
    // Easier: just shift context
    ctx.translate(mapOX + 148 * sc, mapOZ + 95 * sc);
    _drawMapScene(ctx, 0, 0, 0, 0, sc, true);
    ctx.restore();

    // ── Legend ──
    var lgX = mapPad, lgY = H - 50;
    ctx.font = '10px monospace'; ctx.textAlign = 'left';
    var legend = [
      ['#8a3030','Gym / PE'],
      ['#3a6090','Academic Buildings'],
      ['#4a3080','Lit Class'],
      ['#2a5a8a','Bio Lab'],
      ['#3a4a90','Math'],
      ['#806020','Library'],
      ['#704a20','Cafeteria'],
      ['#2a6038','Sports Fields'],
      ['#1864a8','Pool'],
    ];
    for (var li = 0; li < legend.length; li++) {
      var lx = lgX + li * 140;
      ctx.fillStyle = legend[li][0];
      ctx.fillRect(lx, lgY, 12, 12);
      ctx.fillStyle = 'rgba(220,200,140,0.8)';
      ctx.fillText(legend[li][1], lx + 16, lgY + 11);
    }

    // ── Next destination hint (bottom right) ──
    var hintTxt = null;
    if (window.MYTH_CLUB_CHOICE !== null && window.MYTH_CLUB_CHOICE !== undefined && !window.MYTH_BIO_TRIGGERED)
      hintTxt = 'NEXT: Biology Room 102, south of gym (green ring)';
    else if (window.MYTH_BIO_DONE && !window.MYTH_PE_TRIGGERED)
      hintTxt = 'NEXT: PE — Gym (orange ring)';
    if (hintTxt) {
      ctx.fillStyle = 'rgba(8,14,26,0.8)';
      ctx.fillRect(W - 300, H - 58, 280, 38);
      ctx.strokeStyle = 'rgba(200,180,100,0.4)'; ctx.lineWidth = 1;
      ctx.strokeRect(W - 300, H - 58, 280, 38);
      ctx.fillStyle = '#ffe040'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
      ctx.fillText(hintTxt, W - 160, H - 33);
    }

    // Compass rose (top-right)
    var crX = W - 50, crY = 50, crR = 22;
    ctx.strokeStyle = 'rgba(232,208,112,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(crX, crY, crR, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = 'rgba(232,208,112,0.9)'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
    ctx.fillText('N', crX, crY - crR + 10);
    ctx.fillStyle = 'rgba(180,160,80,0.7)'; ctx.font = '9px monospace';
    ctx.fillText('S', crX, crY + crR - 2);
    ctx.fillText('W', crX - crR + 4, crY + 4);
    ctx.fillText('E', crX + crR - 4, crY + 4);
    // North arrow
    ctx.fillStyle = 'rgba(255,60,60,0.9)';
    ctx.beginPath(); ctx.moveTo(crX, crY - crR + 3); ctx.lineTo(crX - 5, crY); ctx.lineTo(crX + 5, crY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(232,208,112,0.5)';
    ctx.beginPath(); ctx.moveTo(crX, crY + crR - 3); ctx.lineTo(crX - 5, crY); ctx.lineTo(crX + 5, crY); ctx.closePath(); ctx.fill();

    // Close hint
    ctx.fillStyle = 'rgba(200,180,100,0.45)'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillText('[M] or [ESC] to close', mapPad, H - 14);

    if (fullMapOpen) requestAnimationFrame(drawFullMap);
  }

  // ============================================================
  // INTERACT PROMPT
  // ============================================================
  var iboxEl = document.getElementById('ibox');
  var itxtEl = document.getElementById('itxt');
  function updatePrompt() {
    var best=null, bestD=Infinity;
    for(var i=0;i<NPCS.length;i++) {
      var n=NPCS[i]; var dx=px-n.x,dz=pz-n.z,d=Math.sqrt(dx*dx+dz*dz);
      if(d<n.radius&&d<bestD){best=n;bestD=d;}
    }
    var nearDoor=false;
    for(var j=0;j<DOORS.length;j++){
      var wp=new THREE.Vector3(); DOORS[j].mesh.getWorldPosition(wp);
      if(Math.sqrt((px-wp.x)*(px-wp.x)+(pz-wp.z)*(pz-wp.z))<7){nearDoor=true;break;}
    }
    if(best){itxtEl.textContent=best.label;iboxEl.style.display='block';}
    else if(nearDoor){itxtEl.textContent='Press F to open/close door';iboxEl.style.display='block';}
    else{iboxEl.style.display='none';}
  }

  // ============================================================
  // MAIN GAME LOOP
  // ============================================================
  var locEl = { textContent: '' }; // replaced by hud-zone update in animate
  var notifEl  = document.getElementById('notif');
  var clock    = new THREE.Clock();

  // Cached DOM refs — never query inside the hot loop
  var _hudZoneEl    = document.getElementById('hud-zone');
  var _pauseOverlay = document.getElementById('pause-overlay');
  var _mmFrame      = 0;   // minimap throttle counter
  var _sunTimer     = 0;   // seconds since last shadow-map update

  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);

    // Timers
    jcd = Math.max(0, jcd - dt);
    ntimer = Math.max(0, ntimer - dt);
    if (ntimer <= 0) notifEl.style.display = 'none';
    sprintCooldown = Math.max(0, sprintCooldown - dt);
    if (sprintCooldown > 0 && sprintOn) sprintOn = false;

    // Movement speed — sprint toggle (Shift) doubles speed, 5s cooldown after use
    var spd = sprintOn ? 11.0 : 5.5;

    // Movement vector in camera-relative space
    var mvx = 0, mvz = 0;
    var fx = Math.sin(yaw), fz = Math.cos(yaw);
    var rx = Math.cos(yaw), rz = -Math.sin(yaw);
    if (keys['KeyW']) { mvx -= fx; mvz -= fz; }
    if (keys['KeyS']) { mvx += fx; mvz += fz; }
    if (keys['KeyA']) { mvx -= rx; mvz -= rz; }
    if (keys['KeyD']) { mvx += rx; mvz += rz; }
    var ml = Math.sqrt(mvx*mvx + mvz*mvz);
    if (ml > 0) { mvx /= ml; mvz /= ml; }

    // Proposed XZ position
    // Block movement during overlay/pause
    if (window.MYTH_ORIENTATION_ACTIVE) { mvx = 0; mvz = 0; }
    if (_pauseOverlay && _pauseOverlay.classList.contains('open')) { mvx = 0; mvz = 0; }
    var npx = px + mvx * spd * dt;
    var npz = pz + mvz * spd * dt;

    // Jump
    if (keys['Space'] && onGnd && jcd === 0) {
      velY = 8.5;
      onGnd = false;
      jcd = 0.32;
    }

    // Gravity
    velY -= 22 * dt;
    var npy = py + velY * dt;

    // Surface / ground detection
    var surfY   = getSurfaceY(npx, npz);
    var groundY = surfY + PH;
    if (npy < groundY) {
      npy  = groundY;
      velY = 0;
      onGnd = true;
    } else {
      onGnd = (npy <= groundY + 0.08);
    }

    // XZ collision sweep (walls, desks, furniture, etc.)
    var result = sweepMove(npx, npy, npz);
    px = result.x;
    py = result.y;
    pz = result.z;
    // Freshman zone restriction — gym + locker room area only
    if (window.MYTH_FRESHMAN_RESTRICTION) {
      px = Math.max(-138, Math.min(-65, px));
      pz = Math.max(-85, Math.min(-22, pz));
    }

    // Camera
    CAM.position.set(px, py, pz);
    CAM.rotation.y = yaw;
    CAM.rotation.x = pitch;

    // Animate pool water
    poolTime += dt;
    if (poolMesh && poolMesh.material) {
      poolMesh.material.opacity = 0.75 + Math.sin(poolTime * 1.2) * 0.06;
      poolMesh.position.y = 0.55 + Math.sin(poolTime * 0.8) * 0.02;
    }

    // Day/night atmosphere — intensity + fog animate freely (cheap)
    _sunTimer += dt;
    var t = Date.now() * 0.00002;
    var dl = Math.max(0.2, Math.sin(t + Math.PI/2));
    sunL.intensity = 1.8 + dl * 0.8;
    ambL.intensity = 0.5 + dl * 0.5;
    var fogR = 0.53 + dl*0.12, fogG = 0.7 + dl*0.1, fogB = 0.85 + dl*0.05;
    SCN.fog.color.setRGB(fogR, fogG, fogB);
    // Move sun position only every 5 s — triggers shadow-map recompute
    if (_sunTimer >= 5.0) {
      _sunTimer = 0;
      sunL.position.set(Math.cos(t)*220, Math.abs(Math.sin(t))*180+50, Math.sin(t)*120);
      REN.shadowMap.needsUpdate = true;
    }
    // Drift clouds using dedicated array (avoids O(n) scan over all scene children)
    var cloudDrift = Math.sin(t * 0.01) * 0.01;
    for (var ci2 = 0; ci2 < cloudSprites.length; ci2++) {
      cloudSprites[ci2].position.x += cloudDrift;
    }

    // Zone-entry orientation trigger — fires when player steps inside the gym
    if (!orientationTriggered && !window.MYTH_ORIENTATION_ACTIVE) {
      if (px >= -112 && px <= -72 && pz >= -77 && pz <= -47) {
        orientationTriggered = true;
        window.MYTH_ORIENTATION_ACTIVE = true;
        if (typeof showOrientationOverlay === 'function') showOrientationOverlay();
      }
    }

    // ── Club fair booth proximity — 1.5s dwell before triggering ──
    if (!window.MYTH_ORIENTATION_ACTIVE &&
        typeof Engine !== 'undefined' && Engine.hasFlag &&
        Engine.hasFlag('orientation_complete') &&
        !window.MYTH_CLUB_CHOICE &&
        !window.MYTH_CLUB_FAIR_TRIGGERED) {
      var _cfDist = function(cx, cz) { var dx=px-cx,dz2=pz-cz; return Math.sqrt(dx*dx+dz2*dz2); };
      var _nearCF = null;
      if      (_cfDist(-115,-34)<4.5) _nearCF='robotics';
      else if (_cfDist(-125,-34)<4.5) _nearCF='football';
      else if (_cfDist(-135,-34)<4.5) _nearCF='none';

      if (_nearCF) {
        if (_cfProxType !== _nearCF) { _cfProxTimer = 0; _cfProxType = _nearCF; }
        _cfProxTimer += dt;
        if (_cfProxTimer >= 1.5) {
          _cfProxTimer = 0; _cfProxType = null;
          window.MYTH_CLUB_FAIR_TRIGGERED = true;
          window.MYTH_ORIENTATION_ACTIVE  = true;
          if (document.pointerLockElement === canvas) document.exitPointerLock();
          if (typeof showClubFairOverlay === 'function') showClubFairOverlay(_nearCF);
        }
      } else {
        _cfProxTimer = 0; _cfProxType = null;
      }
    }

    // ── Bio class trigger — enter bio room south of gym ──
    if (window.MYTH_CLUB_CHOICE !== undefined && window.MYTH_CLUB_CHOICE !== null &&
        !window.MYTH_BIO_TRIGGERED && !window.MYTH_ORIENTATION_ACTIVE) {
      if (px >= -108 && px <= -86 && pz >= -43 && pz <= -29) {
        window.MYTH_BIO_TRIGGERED = true;
        window.MYTH_ORIENTATION_ACTIVE = true;
        if (document.pointerLockElement === canvas) document.exitPointerLock();
        if (typeof showBioClassEvent === 'function') showBioClassEvent();
      }
    }

    // ── PE bomb threat — re-enter gym after Bio class ──
    if (window.MYTH_BIO_DONE && !window.MYTH_PE_TRIGGERED && !window.MYTH_ORIENTATION_ACTIVE) {
      if (px >= -112 && px <= -72 && pz >= -77 && pz <= -47) {
        window.MYTH_PE_TRIGGERED = true;
        window.MYTH_ORIENTATION_ACTIVE = true;
        if (document.pointerLockElement === canvas) document.exitPointerLock();
        if (typeof showPEBombThreat === 'function') showPEBombThreat();
      }
    }

    // ── Sophomore class proximity nav ──
    // Only fires when the player is INSIDE the target building's interior box.
    // Uses minX/maxX/minZ/maxZ from _SOPH_LOCS so walking past a building never
    // accidentally triggers the wrong class.
    if (window.MYTH_SOPH_NAV_TARGET && !window.MYTH_ORIENTATION_ACTIVE) {
      var _snt = window.MYTH_SOPH_NAV_TARGET;
      var _inBox = (_snt.minX !== undefined)
        ? (px >= _snt.minX && px <= _snt.maxX && pz >= _snt.minZ && pz <= _snt.maxZ)
        : (Math.sqrt((px-_snt.x)*(px-_snt.x)+(pz-_snt.z)*(pz-_snt.z)) < _snt.r);
      if (_inBox) {
        window.MYTH_SOPH_NAV_TARGET = null;
        var _hint = document.getElementById('soph-nav-hint');
        if (_hint) _hint.style.display = 'none';
        window.MYTH_ORIENTATION_ACTIVE = true;
        if (document.pointerLockElement === canvas) document.exitPointerLock();
        var _classFns = {
          apcsa:       [window.showAPCSA_Class1,       window.showAPCSA_Final],
          physics:     [window.showPhysics_Class1,     window.showPhysics_FieldTrip],
          studies:     [window.showStudies_Class1,     window.showStudies_Class2],
          robotics:    [window.showRobotics_EC,        null],
          football:    [window.showFootball_EC,        null],
          // Junior year
          calc_bc:     [window.showCalcBC_Class1,      window.showCalcBC_Class2],
          apush:       [window.showAPUSH_Class1,       window.showAPUSH_Class2],
          dual_enroll: [window.showDualEnroll_Class1,  window.showDualEnroll_Class2],
        };
        window.MYTH_SOPH_ON_DONE = _snt.done;
        var _fn = _classFns[_snt.course] && _classFns[_snt.course][_snt.classNum - 1];
        if (_fn) setTimeout(_fn, 200);
      }
    }

    // ── EC navigation countdown timer ──
    if (window.MYTH_EC_NAV_START && window.MYTH_SOPH_NAV_TARGET) {
      var _ecElapsed  = (Date.now() - window.MYTH_EC_NAV_START) / 1000;
      var _ecRemain   = Math.max(0, window.MYTH_EC_NAV_LIMIT - _ecElapsed);
      var _ecMin      = Math.floor(_ecRemain / 60);
      var _ecSec      = Math.floor(_ecRemain % 60);
      var _timerEl    = document.getElementById('ec-nav-timer');
      if (_timerEl) {
        _timerEl.textContent = _ecMin + ':' + (_ecSec < 10 ? '0' : '') + _ecSec;
        _timerEl.style.color = _ecRemain < 20 ? '#ff6060' : _ecRemain < 45 ? '#ffc040' : '#64dcff';
      }
      if (_ecElapsed > window.MYTH_EC_NAV_LIMIT) {
        window.MYTH_EC_LATE      = true;
        window.MYTH_EC_NAV_START = null; // stop ticking
      }
    }

    // ── Football field first-visit flag ──
    if (!window.MYTH_FRESHMAN_RESTRICTION && typeof Engine !== 'undefined' && Engine.hasFlag &&
        !Engine.hasFlag('football_field_visited') &&
        px >= -145 && px <= -22 && pz >= 62 && pz <= 162) {
      Engine.setFlag('football_field_visited');
    }

    // ── Club commitment meeting timer ──
    if (window.MYTH_CLUB_CHOICE && window.MYTH_CLUB_CHOICE !== 'none' &&
        !window.MYTH_ORIENTATION_ACTIVE) {
      clubMeetingTimer += dt;
      if (clubMeetingTimer >= CLUB_MEETING_INTERVAL) {
        clubMeetingTimer = 0;
        // Robotics → gym (-92, -62, r=22); Football → football field (-82, 102, r=30)
        var _ecX = window.MYTH_CLUB_CHOICE === 'robotics' ? -92 : -82;
        var _ecZ = window.MYTH_CLUB_CHOICE === 'robotics' ? -62 : 102;
        var _ecR = window.MYTH_CLUB_CHOICE === 'robotics' ? 22  : 30;
        var _atEC = Math.sqrt(Math.pow(px - _ecX, 2) + Math.pow(pz - _ecZ, 2)) < _ecR;
        if (_atEC) {
          if (typeof Engine !== 'undefined' && Engine.modifyStat)
            Engine.modifyStat('happiness', 0.2);
          showN('✓ You made it to ' +
            (window.MYTH_CLUB_CHOICE === 'robotics' ? 'Robotics Club' : 'Football practice') + '.');
        } else {
          window.MYTH_ORIENTATION_ACTIVE = true;
          if (document.pointerLockElement === canvas) document.exitPointerLock();
          if (typeof showClubMissedOverlay === 'function') showClubMissedOverlay();
        }
      }
    }

    // ── World atmosphere effects (flags set by story overlays) ──
    if (window.MYTH_POWER_OUTAGE) {
      sunL.intensity  = Math.max(0.02, sunL.intensity  - dt * 2.5);
      ambL.intensity  = Math.max(0.02, ambL.intensity  - dt * 2.5);
      SCN.fog.density = Math.min(0.09, SCN.fog.density + dt * 0.35);
      SCN.fog.color.setRGB(0, 0, 0.01);
      SCN.background.set(0x000005);
    } else if (window.MYTH_POWER_RESTORE) {
      SCN.fog.density = Math.max(0.003, SCN.fog.density - dt * 0.06);
      SCN.background.set(0x87ceeb);
      if (SCN.fog.density <= 0.0031) window.MYTH_POWER_RESTORE = false;
    }
    if (window.MYTH_BOMB_THREAT_ACTIVE) {
      SCN.fog.density = Math.min(0.012, SCN.fog.density + dt * 0.02);
      SCN.fog.color.setRGB(0.06, 0.02, 0.02);
    } else if (window.MYTH_BOMB_CLEAR) {
      SCN.fog.density = Math.max(0.003, SCN.fog.density - dt * 0.015);
      if (SCN.fog.density <= 0.0031) window.MYTH_BOMB_CLEAR = false;
    }

    // UI updates
    if (_hudZoneEl) _hudZoneEl.textContent = getZone();
    updatePrompt();
    // Throttle minimap: redraw every 3rd frame (imperceptible at 60 fps)
    _mmFrame++;
    if (!fullMapOpen && (_mmFrame % 3 === 0)) drawMM();
    REN.render(SCN, CAM);
  }

  window.addEventListener('resize', function() {
    CAM.aspect = window.innerWidth / window.innerHeight;
    CAM.updateProjectionMatrix();
    REN.setSize(window.innerWidth, window.innerHeight);
  });


  // Populate pause overlay with current Engine stats
  function populatePauseStats() {
    if (typeof Engine === 'undefined') return;
    var s = Engine.getState();
    if (!s) return;
    var pi = document.getElementById('po-player-info');
    if (pi) pi.innerHTML = '<div class="po-pname">' + (s.player.name || '') + '</div>' +
      '<div class="po-pdetail">Grade ' + s.grade + ' &nbsp;�&nbsp; ' + (s.day || '') + '</div>';
    var ps = document.getElementById('po-stats');
    if (!ps) return;
    ps.innerHTML = Object.entries(s.stats).map(function(e) {
      var k = e[0], v = e[1];
      var isGpa = k === 'gpa';
      var pct   = isGpa ? v / 4 * 100 : v / 10 * 100;
      var norm  = isGpa ? v / 4 : v / 10;
      var col   = norm >= 0.7 ? '#F7B731' : norm >= 0.4 ? '#6BCB77' : '#FC7B54';
      var disp  = isGpa ? v.toFixed(2) : v.toFixed(1);
      return '<div class="po-stat-row"><span class="po-stat-name">' + k.toUpperCase() + '</span>' +
        '<div class="po-stat-bar"><div class="po-stat-fill" style="width:' + pct + '%;background:' + col + '"></div></div>' +
        '<span class="po-stat-val">' + disp + '</span></div>';
    }).join('');
  }

  // Wire pause resume button
  // Resume button handled by game.js _togglePause — no duplicate listener needed here

  // Request pointer lock on canvas click (handles post-orientation re-lock)
  canvas.addEventListener('click', function() { if (!locked) canvas.requestPointerLock(); });

  // Expose canvas for external pointer lock requests
  window.MYTH_WORLD3D_CANVAS = canvas;

  // Compute initial shadow map now that the scene is fully built
  REN.shadowMap.needsUpdate = true;

  animate();
}
