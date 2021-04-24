const glsl = x => x;
const vert = x => x;
const frag = x => x;

const renderer = new THREE.WebGLRenderer({alpha: false});
const scene = new THREE.Scene();

scene.background = new THREE.Color('black');


const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
);

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
    light.position.set(3, 1, 5);
    scene.add(light);

    // const a_light = new THREE.AmbientLight(0x404040);
    // scene.add(a_light);

    const geometry = new THREE.SphereGeometry(0.4, 32, 32);
    const material = new THREE.MeshLambertMaterial({color: 0xff0000});
    const sphere = new THREE.Mesh(geometry, material);
    sphere.rotation.y = 0.4;
    scene.add(sphere);

    /*
    let param = {
        add_plane: () => {
            let folder = gui.addFolder("plane" + plane_id);
            plane_id++;

            let uniforms = {
                time: {value: 1.0},
                backbuffer: {type: "t", value: null},
                camera: {type: "t", value: null},
                resolution: {value: [window.innerWidth, window.innerHeight]},
                plane_id: {value: plane_id},
                texture0: {type: "t", value: null},
                texture1: {type: "t", value: null},
                texture2: {type: "t", value: null},
            };

            let plane = add_plane(scene, backstage, folder, uniforms);
            cbs.push(plane);
            plane.update_material(editor.getValue());           
        },
        loaded: false,
        plane_id: 0
    };
    */

    document.addEventListener('keydown', (event) => {
        if(event.key === "F9") {
            
        }
    });

    window.addEventListener('mousedown', (evt) => {
        let x = evt.pageX;
        let y = evt.pageY;
    });
    window.addEventListener('mousemove', (evt) => {

    });
    window.addEventListener('mouseup', (evt) => {

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

    camera.position.z = 5;


    // param.add_plane();
    animate();
}

window.onload = app;

