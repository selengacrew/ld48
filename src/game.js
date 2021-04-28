const START_SCENE = 'assets/inside1.png'

const VELOCITY = 1.4;
const TENSION = 0.2;
const TENSION_Z = 0.5;
const TENSION_RELAX = 4;


function move(t, dt, state) {
    let forward_velocity = (state.forward - state.backward) * dt * VELOCITY;
    let right_velocity = (state.right - state.left) * dt * VELOCITY;

    let all_velocity = Math.abs(forward_velocity) + Math.abs(right_velocity);

    let up_velocity = (state.up - state.down) * dt * VELOCITY;

    state.controls.moveRight(right_velocity);
    state.controls.moveForward(forward_velocity);
    state.controls.getObject().position.y += (
        Math.sin(state.camera.rotation.x) * forward_velocity + 
        up_velocity
    );
    return all_velocity
}


function game_update(t, dt, state) {

    let all_velocity = move(t, dt, state);

    let camera_yaw = state.camera.clone().rotation.reorder("XZY").y;

    let distance_items = Object.keys(state.panorama)
    .map(name => ({name, value: state.panorama[name]}))
    .filter(item => (item.name !== state.movable_scene || !state.edit))
    .map(item => {
        let distance =
            Math.pow(item.value.position.x - state.camera.position.x, 2) +
            Math.pow(item.value.position.y - state.camera.position.y, 2) +
            Math.pow(item.value.position.z - state.camera.position.z, 2);

        let angle_distance = Math.pow(camera_yaw - item.value.clone().rotation.reorder("XZY").y, 2);
        distance += angle_distance / 300.;

        return {name: item.name, distance};
    })
    .sort((a, b) => a.distance - b.distance);

    state.current_scene = distance_items[0].name;
    state.min_distance = distance_items[0].distance;

    Object.keys(state.panorama).forEach(name => {state.panorama[name].visible = false;});

    let diff_distance = Math.abs(distance_items[0].distance - distance_items[1].distance);
    
    distance_items.slice(0, 1).forEach(item => {
        let near_item = state.panorama[item.name];

        near_item.visible = true;
        near_item.material.uniforms.dist.value = state.edit ? 0. : item.distance;
        near_item.material.uniforms.diff_dist.value = state.edit ? 1. : diff_distance;
        // near_item.material.uniforms.opacity.value = state.edit ? state.scene_opacity : 1.;

        let near_lookat = (new THREE.Vector3(1, 0, 0)).applyEuler(near_item.rotation);
        let camera_lookat = (new THREE.Vector3(1, 0, 0)).applyEuler(state.camera.rotation);

        near_item.material.uniforms.angle_dist.value = camera_lookat.angleTo(near_lookat);

        near_item.material.uniforms.time.value = t;
 

        state.min_angle_distance = near_item.material.uniforms.angle_dist.value;

        // tension
        if (!state.edit) {
            if(all_velocity > 0) {
                state.controls.getObject().position.x += 
                    (near_item.position.x - state.camera.position.x) * dt * TENSION;
                state.controls.getObject().position.y += 
                    (near_item.position.y - state.camera.position.y) * dt * TENSION;
                
                state.controls.getObject().position.z += 
                    (near_item.position.z - state.camera.position.z) * dt * TENSION_Z;
            } else {
                state.controls.getObject().position.x += 
                    (near_item.position.x - state.camera.position.x) * dt * TENSION_RELAX;
                state.controls.getObject().position.y += 
                    (near_item.position.y - state.camera.position.y) * dt * TENSION_RELAX;
                state.controls.getObject().position.z += 
                    (near_item.position.z - state.camera.position.z) * dt * TENSION_RELAX;
            }
        }

        
    });
 
}

function game_init(state) {
    state.scene.background = new THREE.Color('black');

    state.camera = new THREE.PerspectiveCamera(
        80, window.innerWidth / window.innerHeight, 0.1, 1000
    );
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

    const red_material = new THREE.MeshLambertMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3,
    });
 

    const sphere_vertex = vert`    
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
        }
    `;

    const editor_fragment = frag`

        varying vec2 vUv;

        uniform vec2 resolution;
        uniform sampler2D texture0;
        uniform float dist;
        uniform float diff_dist;
        uniform float angle_dist;
        uniform float time;
        uniform float opacity;
        uniform float grid;

        void main() {
            vec2 uv = vec2(1. - abs(vUv.x - 0.5) * 2., vUv.y);

            vec3 color = texture2D(texture0, uv).xyz;

            uv = uv * 20.;

            float gridX = mod(uv.x, 1.) > .95 ? 1. : 0. ;
            float gridY = mod(uv.y, 1.) > .95 ? 1. : 0. ;

            color += gridX * vec3(1., 0., 0.) * grid;
            color += gridY * vec3(0., 0., 1.) * grid;
            
            gl_FragColor = vUv.x < .5 ? vec4(color, opacity) : vec4(0.);

        }
    `;
    
    const sphere_fragment = frag`
        varying vec2 vUv;

        uniform vec2 resolution;
        uniform sampler2D texture0;
        uniform float dist;
        uniform float diff_dist;
        uniform float angle_dist;
        uniform float time;
        uniform float opacity;

        const mat3 sobelX = mat3(-1.0, 0.0, 1.0, -2.0, 0.0, 2.0, -1.0, 0.0, 1.0)/8.0;
        const mat3 sobelY = mat3(-1.0,-2.0,-1.0, 0.0, 0.0, 0.0, 1.0, 2.0, 1.0)/8.0;
        const mat3 gauss = mat3(1.0, 2.0, 1.0, 2.0, 4.0-16.0, 2.0, 1.0, 2.0, 1.0)/8.0;


        vec3 conv3x3(vec2 uv, mat3 fil) {
            vec3 a = vec3(0.0);
            for (int y=0; y<3; ++y)
            for (int x=0; x<3; ++x) {
              vec2 p = uv * resolution + vec2(float(x-1), float(y-1));
              a += fil[y][x] * texture2D(texture0, p / resolution).xyz;
            }
            return a;
        }

        void main() {
            vec2 uv = vec2(1. - abs(vUv.x - 0.5) * 2., vUv.y);

            vec4 origin_color = texture2D(texture0, uv);
            
            vec2 wooUv = uv * (1. + dist * 0.02 * sin(10. * time + sin(uv) * cos(uv) * 20.));
            
            vec3 sobel_color = (conv3x3(wooUv, sobelX) + conv3x3(wooUv, sobelY)) * 10.;

            float fade = smoothstep(0.05, 0.5, dist);
            float opacity_fade = smoothstep(0., 0.05, diff_dist) + 0.5;

            vec3 frontcolor = mix(origin_color.xyz, sobel_color.xyz, fade + 0.15);
            
            float polar = smoothstep(0.05, 0.15, vUv.y) *
            (1. - smoothstep(0.8, 0.9, vUv.y));
            
            vec3 backcolor = vec3(length(conv3x3(vec2(
                fract(vUv.y + uv.x * sin(uv.x + sin(time * 2.4 + uv.y * 100.) * 0.2) * cos(vUv.x * 0.2 - cos(time * 1.9 + uv.x * 320.) * 0.3))
            , uv.y), gauss))) * 20.;

            float angle_fade = smoothstep(1.5, 2.6, angle_dist);

            // smooth fade
            backcolor *= smoothstep(0.01, 0.2, pow((vUv.x - 0.75) * 2., 2.) + pow(vUv.y - 0.5, 2.));
            backcolor *= angle_fade;

            float front = 
                (1. - smoothstep(0.45, 0.52 , vUv.x)) * 
                (smoothstep(0., 0.05, vUv.x)) *
                polar *
                (1. - angle_fade);

            gl_FragColor = mix(
                vec4(opacity_fade * backcolor, 0.5),
                vec4(opacity_fade * frontcolor, origin_color.w),
                front
            ) * vec4(vec3(1.), opacity);
        }
    `;

    // grid
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
                vec2 uv = vUv * 10.;

                float gridX = mod(uv.x, 1.) > .95 ? 1. : 0. ;
                float gridY = mod(uv.y, 1.) > .95 ? 1. : 0. ;

                color += (gridX + gridY) * vec3(1., 0., 1.);

                gl_FragColor = vec4(color, 1.);
            }
        `;

        let uniforms = { 
            time: {value: 0.0},
            resolution: {value: [window.innerWidth, window.innerHeight]},

        };
        let grid_material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader: plane_vertex[0], 
            fragmentShader: plane_fragment_shader[0],
            side: THREE.DoubleSide

        });

        const grid_geometry = new THREE.PlaneGeometry(2, 2, 2 );
        const grid = new THREE.Mesh(grid_geometry, grid_material);
        grid.rotation.x = - Math.PI / 2;
        state.scene.add(grid);
        state.grid = grid;

    const size = 10;
    const divisions = 1000;

    const gridHelper = new THREE.GridHelper( size, divisions );
    state.scene.add( gridHelper );

    state.panorama = {};


    // fixed panorama
    Object.keys(SELENGA_MAP).forEach(name => {
        let sphere_uniforms = {
            texture0: { type: "t", value: THREE.ImageUtils.loadTexture(name)}, 
            resolution: {value: [window.innerWidth, window.innerHeight]},
            dist: {value: 1.0},
            diff_dist: {value: 1.0},
            angle_dist: {value: 0.0},
            time: {value: 0.0},
            opacity: {value: 1.0},
            grid: {value: 0.0},
        };
    
        const sphere_shader = new THREE.ShaderMaterial({
            uniforms: sphere_uniforms,
            vertexShader: sphere_vertex[0], //THREE.DefaultVertex,
            fragmentShader: editor_fragment[0],
            side: THREE.BackSide,
            transparent: true,
            depthTest: false,
            depthWrite: false,
        });

        const geometry = new THREE.SphereGeometry(1, 100, 100, 0, 2 * Math.PI);
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

        // torus knot with 6 pointy ends, like in symbol "*"
        const radius =  3.4 / 50.;  
        const tubeRadius =  1.6 / 50.;  
        const radialSegments =  3;
        const tubularSegments =  29;  
        const p =  1;  
        const q =  6; 
        const asterisk_geometry = new THREE.TorusKnotGeometry(
            radius, tubeRadius, tubularSegments, radialSegments, p, q);

        const sphere = new THREE.Mesh(
            // new THREE.SphereGeometry(0.02, 32, 32),         
            asterisk_geometry,  
            red_material
        );

        sphere.position.x = SELENGA_MAP[name].position[0];
        sphere.position.y = SELENGA_MAP[name].position[1];
        sphere.position.z = SELENGA_MAP[name].position[2];

        state.scene.add(sphere);
    });


   
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

    state.min_distance = 0.1;
    state.min_angle_distance = 0.1;
    
    state.current_scene = START_SCENE;
    let current_position = state.panorama[state.current_scene].position;

    // controller 
    state.controls = new THREE.PointerLockControls(state.camera, document.body);
    state.controls.getObject().position.x = current_position.x;
    state.controls.getObject().position.y = current_position.y;
    state.controls.getObject().position.z = current_position.z;

         
    state.edit = false;
    state.move_scene = false;
    state.rotate_scene = false;
    state.grab_scene = false;
    state.stationary_scene = null;
    state.movable_scene = null;
    state.scene_opacity = .5;
    state.scene_grid = false;
    state.all_visible = false;


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
    
    if(code == "KeyM" && is_press) {
        state.move_scene = !state.move_scene;
    }

    if(code == "KeyR" && is_press) {
        state.rotate_scene = !state.rotate_scene;
    }

    if(code == "KeyY" && is_press) {
        state.edit = !state.edit;
    }

    if(code == "KeyC" && is_press) {
        state.stationary_scene = state.movable_scene;
        state.movable_scene = state.current_scene;

    }    

    if(code == "KeyG" && is_press) {
        state.grab_scene = !state.grab_scene;

    }    

    if(code == "KeyH" && is_press) {
        [state.stationary_scene, state.movable_scene] = [state.movable_scene, state.stationary_scene];

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
        
    }
}