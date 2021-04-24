
function game_update(t, dt, state) {
    state.camera.position.x += (state.right - state.left) * dt * 2;
    state.camera.position.y += (state.up - state.down) * dt * 2;
    state.camera.position.z += -(state.forward - state.backward) * dt * 2;

    // console.log("lookat", state.camera.lookAt);

    // state.ambient.intensity = 1 + 1 * Math.sin(t * 4);

    // state.panorama[0].visible = (0.5 + Math.sin(t * 200) * 0.5) > 0.5;
    // state.panorama[1].visible = (1 - (0.5 + Math.sin(t * 200) * 0.5)) > 0.5;

    let min_distance = 1e308;
    let min_id = null;

    state.panorama.forEach((v, id) => {
        let distance =
            Math.pow(v.position.x - state.camera.position.x, 2) +
            Math.pow(v.position.y - state.camera.position.y, 2) +
            Math.pow(v.position.z - state.camera.position.z, 2);
        if(distance < min_distance) {
            min_distance = distance;
            min_id = id;
        }
        v.visible = false;
    });

    state.panorama[min_id].visible = true;

    /*
    if(state.correction) {
        state.movable_panorama.position.copy(state.camera.position);

        state.movable_panorama.rotation.x = state.camera.rotation.x;
        state.movable_panorama.rotation.y = state.camera.rotation.y;// + Math.PI;
        state.movable_panorama.rotation.z = state.camera.rotation.z;
        

        state.movable_panorama.rotation.copy(state.camera.rotation);
        state.movable_panorama.updateMatrix();
        // state.movable_panorama.translateZ( - 10 );

        
        /*
        state.movable_panorama.position.x = state.camera.position.x;
        state.movable_panorama.position.y = state.camera.position.y;
        state.movable_panorama.position.z = state.camera.position.z;
        *
    }
    */
}

function game_init() {
    let state = {};
    
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color('black');

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
    state.ambient = ambient;
    
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
        sphere_1.position.y = 0;
        sphere_1.position.z = -5;
        state.scene.add(sphere_1);
    }
    
    const textureLoader = new THREE.TextureLoader();

    state.panorama = [];

    // fixed panorama
    SELENGA_MAP.forEach(map_tex => {
        let texture = textureLoader.load(map_tex.name);
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.encoding = THREE.sRGBEncoding;

        const geometry = new THREE.SphereGeometry(1, 100, 100, 0, Math.PI);
        const material = new THREE.MeshLambertMaterial({
            map: texture,
            side: THREE.DoubleSide,
            opacity: 0.99,
            transparent: true
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = map_tex.position[0];
        mesh.position.y = map_tex.position[1];
        mesh.position.z = map_tex.position[2];
        mesh.rotation.x = map_tex.rotation[0];
        mesh.rotation.y = map_tex.rotation[1];
        mesh.rotation.z = map_tex.rotation[2];
        mesh.scale.set(1, 1, -1);
        state.scene.add(mesh);
        state.panorama.push(mesh);
    });

    state.up = 0;
    state.down = 0;
    state.left = 0;
    state.right = 0;
    state.forward = 0;
    state.backward = 0;

    state.correction = false;

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

    if(key == "z" && is_press) {
        console.log(`
            mesh.position.x = ${state.movable_panorama.position.x};
            mesh.position.y = ${state.movable_panorama.position.y};
            mesh.position.z = ${state.movable_panorama.position.z};
            mesh.rotation.x = ${state.movable_panorama.rotation.x};
            mesh.rotation.y = ${state.movable_panorama.rotation.y};
            mesh.rotation.z = ${state.movable_panorama.rotation.z};`);
    }
}
