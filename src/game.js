
const ADD_NEW = true;
const ADD_NAME = 'assets/inside30.png';

function game_update(t, dt, state) {
    state.camera.position.x += (state.right - state.left) * dt * 1;
    state.camera.position.y += (state.up - state.down) * dt * 1;
    state.camera.position.z += -(state.forward - state.backward) * dt * 1;

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

    if(!ADD_NEW) {
        state.panorama[min_id].visible = true;
    } else {
        state.panorama[min_id].visible = (0.5 + Math.sin(t * 200) * 0.5) > 0.5;
        state.new_panorama.visible = (1 - (0.5 + Math.sin(t * 200) * 0.5)) > 0.5;

        state.new_panorama.position.copy(state.camera.position);
        state.new_panorama.rotation.x = state.camera.rotation.x + state.offset_x;
        state.new_panorama.rotation.x = state.camera.rotation.y + state.offset_y;
        state.new_panorama.rotation.x = state.camera.rotation.z + state.offset_z;
        state.new_panorama.updateMatrix();
    }
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

    // attached to camera
    if(ADD_NEW) {
        let texture = textureLoader.load(ADD_NAME);
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
        mesh.scale.set(1, 1, -1);
        state.scene.add(mesh);
        state.new_panorama = mesh;
    }

    // floor shader

    const plane_vertex = vert`    
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
    }
    `

    const plane_fragment_shader = frag`
        precision mediump float;
        precision mediump int;

        uniform float time;

        varying vec2 vUv;

        void main() {
            vec3 color = vec3(0.);
            vec2 uv = vUv * 100.;

            float gridX = mod(uv.x, 1.) > .99 ? 1. : 0. ;
            float gridY = mod(uv.y, 1.) > .99 ? 1. : 0. ;

            color += (gridX + gridY) * vec3(1., 0., 1.);

            gl_FragColor = vec4(color, 1.);
        }
    `;

    let uniforms = { 
        time: {value: 0.0},
        resolution: {value: [window.innerWidth, window.innerHeight]},

    };
    let floor_material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: plane_vertex[0], //THREE.DefaultVertex,
        fragmentShader: plane_fragment_shader[0]
    });

    // floor
    {
        const floor_geometry = new THREE.PlaneGeometry(100, 100, 32 );
        // const floor_geometry = new THREE.BoxGeometry( 1, 1, 1 );

        const floor = new THREE.Mesh(floor_geometry, floor_material);
        floor.rotation.x = - Math.PI / 2;
        // floor.rotation.set(new THREE.Vector3( 0, 0, Math.PI / 1));

        floor.position.set(0, -7, 0);

        state.scene.add(floor);
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

    if(key == "z" && is_press) {
        console.log(`{
            name: '${ADD_NAME}',
            position: [${state.new_panorama.position.x}, ${state.new_panorama.position.y}, ${state.new_panorama.position.z}],
            rotation: [${state.new_panorama.rotation.x}, ${state.new_panorama.rotation.y}, ${state.new_panorama.rotation.z}]
        },`);
    }
}
