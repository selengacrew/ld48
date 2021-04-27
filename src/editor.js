function editor_update(t, dt, state) {

    if (!state.move_scene && !state.rotate_scene) {
        move(t, dt, state);
    }

    Object.keys(state.panorama).forEach(name => {state.panorama[name].visible = false;});

    state.panorama[state.stationary_scene].visible = true;
    state.panorama[state.stationary_scene].material.uniforms.opacity.value = 1. - state.scene_opacity;


    let new_panorama = state.panorama[state.movable_scene];
    new_panorama.visible = true;
    new_panorama.material.uniforms.opacity.value = state.scene_opacity;

    new_panorama.material.uniforms.dist.value = 0.;
    new_panorama.material.uniforms.diff_dist.value = 1.;

    // new_panorama.rotation.x = state.offset_x;
    // new_panorama.rotation.y = state.offset_y;
    // new_panorama.rotation.z = state.offset_z;
    // new_panorama.updateMatrix(); 

    let forward_velocity = (state.forward - state.backward) * dt * VELOCITY;
    let right_velocity = (state.right - state.left) * dt * VELOCITY;    
    let up_velocity = (state.up - state.down) * dt * VELOCITY;

    if (state.move_scene)  {
   
        // new_panorama.position.copy(state.camera.position);
        // new_panorama.rotation.x = state.camera.rotation.x + state.offset_x;
        // new_panorama.rotation.y = state.camera.rotation.y + state.offset_y;
        // new_panorama.rotation.z = state.camera.rotation.z + state.offset_z;

        // new_panorama.position.x = state.controls.getObject().position.x; 
        // new_panorama.position.y = state.controls.getObject().position.y; 
        // new_panorama.position.z = state.controls.getObject().position.z; 

        new_panorama.position.z += forward_velocity;
        new_panorama.position.x += right_velocity;
        new_panorama.position.y += up_velocity;

        new_panorama.updateMatrix(); 
    }

    if (state.rotate_scene) {
        new_panorama.rotation.x += right_velocity;
        new_panorama.rotation.y += up_velocity;
        new_panorama.rotation.z += forward_velocity;

    }

    state.grid.position.set(new_panorama.position.x, new_panorama.position.y, new_panorama.position.z);


 
}
