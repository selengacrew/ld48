const glsl = x => x;
const vert = x => x;
const frag = x => x;

const renderer = new THREE.WebGLRenderer({alpha: false});
const scene = new THREE.Scene();

scene.background = new THREE.Color('purple');

const camera = new THREE.PerspectiveCamera(
    80, window.innerWidth / window.innerHeight, 0.1, 1000
);

const controls = new THREE.PointerLockControls(camera, document.body);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

// const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);

let time = 0;
let prev_time = (+new Date());

// console.log(window.innerHeight, window.innerWidth);
const rtWidth = window.innerWidth;
const rtHeight = window.innerHeight;

  
let pass = 1;

function animate() {

    let now = (+new Date());
    let dt = (now - prev_time) / 1000;
    prev_time = now;
    
    time += dt;
    
    // renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    // cbs.forEach(cb => cb.update_uniform({time, backbuffer: renderTargets[(pass - 1) % 2].texture}));
        
    requestAnimationFrame(animate);   
}

function app() {
    const gui = new dat.GUI();

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const light = new THREE.PointLight(0xff0000, 1, 100);
    light.color.set('white');
    light.position.set(3, 1, 5);
    scene.add(light);

    // const a_light = new THREE.AmbientLight(0x404040);
    // scene.add(a_light);
    
    const red_material = new THREE.MeshLambertMaterial({color: 0xff0000});

    const sphere_0 = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 32, 32),
        red_material
    );
    // sphere_0.rotation.y = 0.4;
    sphere_0.position.x = 2;
    sphere_0.position.z = -5;
    // scene.add(sphere_0);
    
    const sphere_1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 32, 32),
        red_material
    );
    sphere_1.position.x = 0;
    sphere_1.position.z = -5;
    // scene.add(sphere_1);
    
    const green_material = new THREE.MeshLambertMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide
    });
    
    const outer_sphere = new THREE.Mesh(
        new THREE.SphereGeometry(6, 32, 32),
        green_material
    );
    // sphere.rotation.y = 0.4;
    outer_sphere.position.x = 0;
    // scene.add(outer_sphere);

    const textureLoader = new THREE.TextureLoader();
    textureEquirec = textureLoader.load('assets/inside15.png');

    textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
    textureEquirec.encoding = THREE.sRGBEncoding;

    const macht_geometry = new THREE.SphereGeometry(2, 32, 32);
    const macht_material = new THREE.MeshLambertMaterial({
        envMap: textureEquirec,
        side: THREE.DoubleSide
    });
    const macht_sphere = new THREE.Mesh(macht_geometry, macht_material);
    // sphere.rotation.y = 7.8;
    // macht_sphere.position.set(3, 3.3, -10);
    let ssize = 8;
    macht_sphere.scale.set(ssize, ssize, ssize);

    scene.add(macht_sphere);

    let locked = false;

    document.addEventListener('keydown', (event) => {
        if(event.key === "Control") {
            if(!locked) {
                controls.lock();
                locked = true;
            } else {
                controls.unlock();
                locked = false;
            }
        }
    });

    document.addEventListener('keyup', (event) => {
        if(event.key === "Control") {
            move_camera = false;
        }
    });

    window.addEventListener('mousedown', (evt) => {
        
    });
    window.addEventListener('mousemove', (evt) => {
        
    });
    window.addEventListener('mouseup', (evt) => {
        
    });

    let param = {one: 80};
    gui.add(param, 'one')
        .min(5).max(300).step(1)
        .listen().onChange(value => {
            camera.fov = value;
            camera.updateProjectionMatrix();
        });

    /*
    gui.add(param, "add_plane");
    gui.add(param, 'plane_id')
        .min(0).max(5).step(1)
        .listen().onChange(value => param.plane_id = value);

    param.add_plane();
    */

    /*
    const texture_loader = new THREE.TextureLoader();
    texture_loader.load("assets/frame.jpg",
        (texture) => {
            cbs.forEach(cb => cb.update_uniform({texture1: texture}));
        },
        null,
        (err) => alert("texture load error " + JSON.stringify(err))
    );
    */

    // console.log(test_texture);

    camera.position.z = 0;


    // param.add_plane();
    animate();
}

window.onload = app;
window.addEventListener('resize', onWindowResize);

