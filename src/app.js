const glsl = x => x;
const vert = x => x;
const frag = x => x;

const renderer = new THREE.WebGLRenderer({alpha: false});

function app() {
    const gui = new dat.GUI();

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    let locked = false;

    state = game_init();

    function onWindowResize() {
        state.camera.aspect = window.innerWidth / window.innerHeight;
        state.camera.updateProjectionMatrix();
    
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
    window.addEventListener('resize', onWindowResize);

    document.addEventListener('keydown', (event) => {
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

    gui.add(state, 'offset_x')
        .min(-Math.PI).max(Math.PI).step(0.01)
        .listen().onChange(value => state.offset_x = value);
    gui.add(state, 'offset_y')
        .min(-Math.PI).max(Math.PI).step(0.01)
        .listen().onChange(value => state.offset_y = value);
    gui.add(state, 'offset_z')
        .min(-Math.PI).max(Math.PI).step(0.01)
        .listen().onChange(value => state.offset_z = value);
    let current_gui = gui.add(state, 'current_scene');

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
            
        current_gui.updateDisplay();
        requestAnimationFrame(animate);   
    }
    
    animate();
}

window.onload = app;
