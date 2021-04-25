
const ADD_NEW = true;
let ADD_NAME = 'assets/inside41.png';

function set_active(name) {
    ADD_NAME = name;
    console.log('active: ', name);
};

const VELOCITY = 1;

function game_update(t, dt, state) {
    
    // console.log(state.new_panorama);
    let forward_velocity = (state.forward - state.backward) * dt * VELOCITY;

    state.controls.moveRight((state.right - state.left) * dt * VELOCITY);
    state.controls.moveForward(forward_velocity);
    state.controls.getObject().position.y += (
        Math.sin(state.camera.rotation.x) * forward_velocity + 
        (state.up - state.down) * dt * VELOCITY
    );

    let min_distance = 1e308;
    let min_name = null;

    Object.keys(state.panorama).forEach((name) => {
        let distance =
            Math.pow(state.panorama[name].position.x - state.camera.position.x, 2) +
            Math.pow(state.panorama[name].position.y - state.camera.position.y, 2) +
            Math.pow(state.panorama[name].position.z - state.camera.position.z, 2);
        if(distance < min_distance && name !== ADD_NAME) {
            min_distance = distance;
            min_name = name;
        }
        state.panorama[name].visible = false;
    });

    state.current_scene = min_name;

    if(!ADD_NEW) {
        state.panorama[min_name].visible = true;
    } else {
 
        state.panorama[min_name].visible = (0.5 + Math.sin(t * 100) * 0.5) > 0.5;

        let new_panorama = state.panorama[ADD_NAME];
        new_panorama.visible = (1 - (0.5 + Math.sin(t * 100) * 0.5)) > .5;
        new_panorama.position.copy(state.camera.position);
        new_panorama.rotation.x = state.camera.rotation.x + state.offset_x;
        new_panorama.rotation.y = state.camera.rotation.y + state.offset_y;
        new_panorama.rotation.z = state.camera.rotation.z + state.offset_z;
        new_panorama.updateMatrix();

        // debugger;

        
    }
}

function game_init(state) {
    state.scene.background = new THREE.Color('purple');

    state.camera = new THREE.PerspectiveCamera(
        80, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    state.camera.position = [-0.8606581746217031, -0.04694518939653785, -2.0944195266261647];
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

    const red_material = new THREE.MeshLambertMaterial({color: 0xff0000});
 
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

        gl_FragColor = conv3x3(vUv, sobelX) + conv3x3(vUv, sobelY) + texture2D(texture0, vUv) * 0.4;

        }
    `;

    // state.panorama = [];
    state.panorama = {};


    // fixed panorama
    Object.keys(SELENGA_MAP).forEach(name => {
        let sphere_uniforms = {
            texture0: { type: "t", value: THREE.ImageUtils.loadTexture(name)}, 
            resolution: {value: [window.innerWidth, window.innerHeight]}
        };
    
        const sphere_shader = new THREE.ShaderMaterial({
            uniforms: sphere_uniforms,
            vertexShader: sphere_vertex[0], //THREE.DefaultVertex,
            fragmentShader: sphere_fragment[0],
            side: THREE.DoubleSide
        });

        const geometry = new THREE.SphereGeometry(1, 100, 100, 0, Math.PI);
        const mesh = new THREE.Mesh(geometry, sphere_shader);
        mesh.position.x = SELENGA_MAP[name].position[0];
        mesh.position.y = SELENGA_MAP[name].position[1];
        mesh.position.z = SELENGA_MAP[name].position[2];
        mesh.rotation.x = SELENGA_MAP[name].rotation[0];
        mesh.rotation.y = SELENGA_MAP[name].rotation[1];
        mesh.rotation.z = SELENGA_MAP[name].rotation[2];
        mesh.scale.set(1, 1, -1);
        state.scene.add(mesh);
        state.panorama[name] = mesh;
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
        // const floor_geometry = new THREE.BoxGeometry( 1, 1, 1 );

        const floor = new THREE.Mesh(floor_geometry, floor_material);
        floor.rotation.x = - Math.PI / 2;
        // floor.rotation.set(new THREE.Vector3( 0, 0, Math.PI / 1));

        floor.position.set(0, -7, 0);

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

    state.current_scene = "";

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
        positions = ""

        Object.keys(state.panorama).forEach((name) => {
            positions += `{
                ${name}: {
                    position: [${state.panorama[name].position.x}, ${state.panorama[name].position.y}, ${state.panorama[name].position.z}],
                    rotation: [${state.panorama[name].rotation.x}, ${state.panorama[name].rotation.y}, ${state.panorama[name].rotation.z}]
                }
            },`;
        });
        console.log(positions);
    }
}
