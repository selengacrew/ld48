
function game_update(t, dt, state) {
    state.camera.position.z += -(state.forward - state.backward) * dt * 2;
    state.camera.position.x += (state.right - state.left) * dt * 2;
    state.camera.position.y += (state.up - state.down) * dt * 2;
}

function game_init() {
    let state = {};
    
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color('purple');

    state.camera = new THREE.PerspectiveCamera(
        80, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    state.camera.position.z = 0;

    state.controls = new THREE.PointerLockControls(state.camera, document.body);

    
    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.color.set('white');
    light.position.set(3, 1, 5);
    state.scene.add(light);
    

    
    const ambient = new THREE.AmbientLight(0x010101, 0.4);
    ambient.color.set('white');
    state.scene.add(ambient);
    
    
    const red_material = new THREE.MeshLambertMaterial({color: 0xff0000});

    {
        const sphere_0 = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 32, 32),
            red_material
        );
        // sphere_0.rotation.y = 0.4;
        sphere_0.position.x = 2;
        sphere_0.position.z = -5;
        // state.scene.add(sphere_0);
    }
 
    {
        const sphere_1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 32, 32),
            red_material
        );
        sphere_1.position.x = 0;
        sphere_1.position.z = -5;
        state.scene.add(sphere_1);
    }

    {
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
    }

    {
        const textureLoader = new THREE.TextureLoader();
        textureEquirec = textureLoader.load('assets/inside23.png');

        textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
        textureEquirec.encoding = THREE.sRGBEncoding;

        const macht_geometry = new THREE.SphereGeometry(100, 32, 32, 0, Math.PI);
        const macht_material = new THREE.MeshLambertMaterial({
            map: textureEquirec,
            side: THREE.DoubleSide
        });
        const macht_sphere = new THREE.Mesh(macht_geometry, macht_material);
        macht_sphere.rotation.y = Math.PI;
        macht_sphere.rotation.x = 0;
        // macht_sphere.position.set(3, 3.3, -10);
        let ssize = 8;
        macht_sphere.scale.set(ssize, ssize, ssize);
        state.macht_sphere = macht_sphere;

        state.scene.add(macht_sphere);
    }

    state.up = 0;
    state.down = 0;
    state.left = 0;
    state.right = 0;
    state.forward = 0;
    state.backward = 0;

    return state;
}

function game_handle_key(key, is_press, state) {
    if(key === "w") {
        state.forward = is_press ? 1 : 0;
    }
    if(key === "s") {
        state.backward = is_press ? 1 : 0;
    }
    if(key === "a") {
        state.left = is_press ? 1 : 0;
    }
    if(key === "d") {
        state.right = is_press ? 1 : 0;
    }
    if(key === "e") {
        state.up = is_press ? 1 : 0;
    }
    if(key === "q") {
        state.down = is_press ? 1 : 0;
    }
}
