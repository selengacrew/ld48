
const ADD_NEW = false;
let ADD_NAME = 'assets/inside1.png';

function set_active(name) {
    ADD_NAME = name;
    console.log('active: ', name);
};

const VELOCITY = 0.4;

function game_update(t, dt, state) {
    
    // console.log(state.new_panorama);
    let forward_velocity = (state.forward - state.backward) * dt * VELOCITY;

    state.controls.moveRight((state.right - state.left) * dt * VELOCITY);
    state.controls.moveForward(forward_velocity);
    state.controls.getObject().position.y += (
        Math.sin(state.camera.rotation.x) * forward_velocity + 
        (state.up - state.down) * dt * VELOCITY
    );

    let camera_yaw = state.camera.clone().rotation.reorder("XZY").y;

    let distance_items = Object.keys(state.panorama)
    .map(name => ({name, value: state.panorama[name]}))
    .filter(item => item.name !== ADD_NAME)
    .map(item => {
        let distance =
            Math.pow(item.value.position.x - state.camera.position.x, 2) +
            Math.pow(item.value.position.y - state.camera.position.y, 2) +
            Math.pow(item.value.position.z - state.camera.position.z, 2);

        let angle_distance = Math.pow(camera_yaw - item.value.rotation.reorder("XZY").y, 2);
        distance += angle_distance / 100.;

        return {name: item.name, distance};
    })
    .sort((a, b) => a.distance - b.distance);

    state.current_scene = distance_items[0].name;
    state.min_distance = distance_items[0].distance;

    Object.keys(state.panorama).forEach(name => {state.panorama[name].visible = false;});

    let near_item = state.panorama[distance_items[0].name];

    near_item.visible = true;
    near_item.material.uniforms.opacity.value = ADD_NEW ? 0.25 : state.min_distance;
    near_item.material.uniforms.time.value = t;
    if(state.min_distance > 0.5) {
        let x = state.min_distance * 2;
        near_item.scale.set(x, x, -x);
    } else {
        near_item.scale.set(1, 1, -1);
    }

    if(ADD_NEW) {
        near_item.visible = true; //  (0.5 + Math.sin(t * 100) * 0.5) > 0.5;

        let new_panorama = state.panorama[ADD_NAME];
        new_panorama.visible = true; // (1 - (0.5 + Math.sin(t * 100) * 0.5)) > .5;
        new_panorama.position.copy(state.camera.position);
        new_panorama.rotation.x = state.camera.rotation.x + state.offset_x;
        new_panorama.rotation.y = state.camera.rotation.y + state.offset_y;
        new_panorama.rotation.z = state.camera.rotation.z + state.offset_z;
        new_panorama.updateMatrix(); 
    }
}

function game_init(state) {
    state.scene.background = new THREE.Color('black');

    state.camera = new THREE.PerspectiveCamera(
        80, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    // state.camera.position = [-0.8606581746217031, -0.04694518939653785, -2.0944195266261647];
    state.camera.position.set(0., 0., 0.);
    state.camera.rotation.order = 'XYZ';


    const listener = new THREE.AudioListener();
    state.camera.add(listener);
    state.sound = new THREE.PositionalAudio(listener);
    state.sound.panner.setPosition(0, 0, -1);
    state.sound.setRolloffFactor(10); 
    state.sound.setMaxDistance(0.1);
    state.sound.setDistanceModel("exponential");

    const audioLoader = new THREE.AudioLoader();
    audioLoader.load( 'assets/sound.mp3', function(buffer) {
        state.sound.setBuffer( buffer );
        state.sound.setRefDistance(0.1);
        // state.sound.play();
    });


    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.color.set('white');
    light.position.set(3, 1, 5);
    state.scene.add(light);
    
    const ambient = new THREE.AmbientLight(0x010101, 0.4);
    ambient.color.set('white');
    state.scene.add(ambient);

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

    const red_material = new THREE.MeshLambertMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3,
    });
 
    {
        const sphere_1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 32, 32),
            red_material
        );
        sphere_1.position.x = 0;
        sphere_1.position.z = -1;
        state.scene.add(sphere_1);
    }

    const textureLoader = new THREE.TextureLoader();

    const sphere_vertex = vert`    
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
        }
    `;
    
    const sphere_fragment = frag`
        varying vec2 vUv;

        uniform vec2 resolution;
        uniform sampler2D texture0;
        uniform float opacity;
        uniform float time;

        const mat3 sobelX = mat3(-1.0, 0.0, 1.0, -2.0, 0.0, 2.0, -1.0, 0.0, 1.0)/8.0;
        const mat3 sobelY = mat3(-1.0,-2.0,-1.0, 0.0, 0.0, 0.0, 1.0, 2.0, 1.0)/8.0;

        vec4 conv3x3(vec2 uv, mat3 fil) {
            vec4 a = vec4(0.0);
            for (int y=0; y<3; ++y)
            for (int x=0; x<3; ++x) {
              vec2 p = uv * resolution + vec2(float(x-1), float(y-1));
              a += fil[y][x] * texture2D(texture0, p / resolution);
            }
            return a;
        }

        void main() {
            // vec2 uv = vec2(fract(vUv.x * 2.), vUv.y);
            vec2 uv = vUv;
            vec2 wooUv = uv * (1. + opacity * 0.02 * sin(10. * time + sin(uv) * cos(uv) * 20.));
            vec4 origin_color = texture2D(texture0, uv);
            vec4 sobel_color = (conv3x3(wooUv, sobelX) + conv3x3(wooUv, sobelY)) * 10.;

            float fade = smoothstep(0.05, 0.5, opacity);

            vec3 color = mix(origin_color.xyz, sobel_color.xyz, fade + 0.15);

            gl_FragColor = vec4(color.xyz, origin_color.w);

        }
    `;

    // state.panorama = [];
    state.panorama = {};


    // fixed panorama
    Object.keys(SELENGA_MAP).forEach(name => {
        let sphere_uniforms = {
            texture0: { type: "t", value: THREE.ImageUtils.loadTexture(name)}, 
            resolution: {value: [window.innerWidth, window.innerHeight]},
            opacity: {value: 1.0},
            time: {value: 0.0},
        };
    
        const sphere_shader = new THREE.ShaderMaterial({
            uniforms: sphere_uniforms,
            vertexShader: sphere_vertex[0], //THREE.DefaultVertex,
            fragmentShader: sphere_fragment[0],
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
        });

        const geometry = new THREE.SphereGeometry(1, 100, 100, 0, 1 * Math.PI);
        const mesh = new THREE.Mesh(geometry, sphere_shader);
        mesh.position.x = SELENGA_MAP[name].position[0];
        mesh.position.y = SELENGA_MAP[name].position[1];
        mesh.position.z = SELENGA_MAP[name].position[2];
        mesh.rotation.x = SELENGA_MAP[name].rotation[0];
        mesh.rotation.y = SELENGA_MAP[name].rotation[1];
        mesh.rotation.z = SELENGA_MAP[name].rotation[2];
        mesh.rotation.order = 'XYZ';
        mesh.scale.set(1, 1, -1);
        state.scene.add(mesh);
        state.panorama[name] = mesh;

        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.02, 32, 32),
            red_material
        );

        sphere.position.x = SELENGA_MAP[name].position[0];
        sphere.position.y = SELENGA_MAP[name].position[1];
        sphere.position.z = SELENGA_MAP[name].position[2];

        state.scene.add(sphere);
    });

    state.new_panorama = state.panorama[1];

    // floor
    {
        const plane_vertex = vert`    
            varying vec2 vUv;
            void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
            }
        `;

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
            fragmentShader: plane_fragment_shader[0],
            side: THREE.DoubleSide

        });

        const floor_geometry = new THREE.PlaneGeometry(100, 100, 32 );
        const floor = new THREE.Mesh(floor_geometry, floor_material);
        floor.rotation.x = - Math.PI / 2;

        floor.position.set(0, -200, 0);

        state.scene.add(floor);

        // fun
    
        const sphere_0 = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 32, 32),
            floor_material,
        );
        
        sphere_0.position.x = 2;
        sphere_0.position.z = -5;
        state.scene.add(sphere_0);
    }

    state.up = 0;
    state.down = 0;
    state.left = 0;
    state.right = 0;
    state.forward = 0;
    state.backward = 0;

    state.offset_x = 0;
    state.offset_y = 0;
    state.offset_z = 0;

    // state.current_scene = "";

    state.min_distance = 0.1;
    state.min_angle_distance = 0.1;

    state.current_scene = 'assets/inside1.png';

    // controller 
    state.controls = new THREE.PointerLockControls(state.camera, document.body);
    // state.controls.poisiton = [0., 0., 0.];

        
    console.log("camera", state.camera.position);
    state.controls.getObject().position.x = 0.;
    state.controls.getObject().position.y = 0.;
    state.controls.getObject().position.z = 0.;

    return state;
}



function game_handle_key(code, is_press, state) {

    if(code === 'ArrowUp' || code === 'KeyW') {
        state.forward = is_press ? 1 : 0;
    }
    if(code === 'ArrowDown' || code === 'KeyS') {
        state.backward = is_press ? 1 : 0;
    }
    if(code === 'ArrowLeft' || code === 'KeyA') {
        state.left = is_press ? 1 : 0;
    }
    if(code === 'ArrowRight' || code === 'KeyD') {
        state.right = is_press ? 1 : 0;
    }
    if(code === "KeyE") {
        state.up = is_press ? 1 : 0;
    }
    if(code === "KeyQ") {
        state.down = is_press ? 1 : 0;
    }

    if(code == "KeyF" && is_press) {
        state.sound.play();
    }

    if(code == "KeyZ" && is_press) {
        positions = "const SELENGA_MAP =  {"

        Object.keys(state.panorama).forEach((name) => {
            positions += `
                "${name}": {
                    position: [${state.panorama[name].position.x}, ${state.panorama[name].position.y}, ${state.panorama[name].position.z}],
                    rotation: [${state.panorama[name].rotation.x}, ${state.panorama[name].rotation.y}, ${state.panorama[name].rotation.z}]
                },
            `;
        });

        positions += "};";    
        console.log(positions);   
        console.log(state.camera.position);     
        console.log(state.controls.getObject().position);
    }
}
