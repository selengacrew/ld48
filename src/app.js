const glsl = x => x;
const vert = x => x;
const frag = x => x;

const renderer = new THREE.WebGLRenderer({alpha: false});

function app() {
    const gui = new dat.GUI();

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    let locked = false;

    let state = {};
    state.scene = new THREE.Scene();

    state = game_init(state);

    // moved to game.js
    // state.controls = new THREE.PointerLockControls(state.camera, document.body);
    // // state.controls.poisiton = [0, 0, 0];

    function onWindowResize() {
        state.camera.aspect = window.innerWidth / window.innerHeight;
        state.camera.updateProjectionMatrix();
    
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
    window.addEventListener('resize', onWindowResize);

    document.addEventListener('keydown', (event) => {
        if(event.code !== "F11" && event.code !== "F12" && event.code !== "F5") {
            event.preventDefault();
        }

        if(event.key === "Control") {
            if(!locked) {
                state.controls.lock();
                locked = true;
            } else {
                state.controls.unlock();
                locked = false;
            }
        } else {
            game_handle_key(event.code, true, state);
        }
    });

    document.addEventListener('keyup', (event) => {
        if(event.code !== "F11" && event.code !== "F12" && event.code !== "F5") {
            event.preventDefault();
        }

        if(event.key === "Control") {
        } else {
            game_handle_key(event.code, false, state);
        }
    });

    window.addEventListener('mousedown', (evt) => {
        
    });
    window.addEventListener('mousemove', (evt) => {
        
    });
    window.addEventListener('mouseup', (evt) => {
        
    });

    let gui_updater = [];

    gui.add(state, 'offset_x')
        .min(-Math.PI).max(Math.PI).step(0.01)
        .listen().onChange(value => state.offset_x = value);
    gui.add(state, 'offset_y')
        .min(-Math.PI).max(Math.PI).step(0.01)
        .listen().onChange(value => state.offset_y = value);
    gui.add(state, 'offset_z')
        .min(-Math.PI).max(Math.PI).step(0.01)
        .listen().onChange(value => state.offset_z = value);
    
    gui_updater.push(
        gui.add(state, "min_distance")
    );
    gui_updater.push(
        gui.add(state, 'current_scene')
    );
    // let current_gui = gui.add(state, 'current_scene').listen().onChange(value => state.addnew(value));

    gui_updater.push( 
        gui.add(state, 'new_scene', Object.keys(
        state.panorama).filter(item => (item !== state.current_scene))) 
        .listen().onChange(value => set_active(value))
    );

    gui.add(state, 'add_new').listen().onChange(value => {state.add_new = value;});  
    
    gui_updater.push(
        gui.add(state, "min_angle_distance")
    );

    // a.map((n) => { return " " + n + " " })



    let time = 0;
    let prev_time = (+new Date());
        
    function animate() {
    
        let now = (+new Date());
        let dt = (now - prev_time) / 1000;
        prev_time = now;
        
        time += dt;
    
        game_update(time, dt, state);
        
        // renderer.setRenderTarget(null);
        // state.camera.updateProjectionMatrix();
        // console.log(state.camera);
        renderer.render(state.scene, state.camera);
        gui_updater.forEach(x => x.updateDisplay());
        
        requestAnimationFrame(animate);   
    }
    
    animate();
}

window.onload = app;
