resize();

let current_design = false;

let normalmap = new THREE.CanvasTexture(drawImageMap("resources/textures/normals/ln.jpg"));
normalmap.repeat.set(4, 4);
normalmap.wrapS = THREE.RepeatWrapping;
normalmap.wrapT = THREE.RepeatWrapping;


function create_leather_mat(color) {
    let mat = new THREE.MeshPhysicalMaterial();
    mat.color = color;
    // mat.vertexColors = new THREE.Color("#FFFFFF");
    // mat.color = color;
    // mat.c_color = color;
    // mat.map = new THREE.CanvasTexture( drawBlankMap(color, [512,512]), "map diffuse");
    // mat.map.wrapT = THREE.RepeatWrapping;
    // mat.map.wrapS = THREE.RepeatWrapping;
    // mat.bumpMap = new THREE.CanvasTexture( drawBlankMap(mat.color) );
    setTimeout(function () {
        mat.roughness = 0.45;
        mat.metalness = 0;
        mat.emissive = new THREE.Color(1, 1, 1);
        mat.emissiveIntensity = 0;
        mat.envMap = hdrCubeRenderTarget.texture;
        mat.envMapIntensity = 1;
        mat.normalMap = normalmap;
        mat.normalMap.repeat.set(0.5, 0.5);
        mat.normalMap.needsUpdate = true;
        mat.normalScale = new THREE.Vector2(1, 1);
        mat.side = THREE.DoubleSide;
        mat.needsUpdate = true;
    }, 400);
    return mat
}

function applyEnvMapToGltf() {
    for (let i = 0; i < bakedmesh.children[0].children.length; i++) {
        bakedmesh.children[0].children[i].material.envMap = hdrCubeRenderTarget.texture;
        bakedmesh.children[0].children[i].material.envMapIntensity = 1;
    }
}


function drawImageMap(image_src, scale = [1024, 1024]) {
    let uid = create_uid();
    let map = "<canvas class='default " + uid + " map' width='" + scale[0] + "' height='" + scale[1] + "'></canvas>";
    $("#maps").append(map);
    let n = $(".map." + uid)[0];
    let ntx = n.getContext("2d");
    let imageObj = new Image();
    imageObj.onload = function () {
        ntx.drawImage(imageObj, 0, 0, scale[0], scale[1]);
    };
    imageObj.src = image_src;
    return n
}


function create_uid() {
    let S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}


function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

document.addEventListener('mousedown', SelectComponent);

function SelectComponent(event) {
    // event.preventDefault();
    let controls = $("#controls");
    if ((event.clientX < (window.innerWidth - controls.outerWidth()))
        &&
        (event.clientY < (window.innerHeight - controls.outerHeight()))
        && !config_open) {
        for (let i = 0; i < selected.length; i++) {
            selected[i].material.emissiveIntensity = 0;
        }
        if (event.ctrlKey) {
        } else {
            selected = [];
        }

        let mouse3D = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5);
        let raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse3D, camera);
        let intersects = raycaster.intersectObjects(selectable);
        if (intersects.length > 0) {
            // intersects[ 0 ].object.material.color.setHex( Math.random() * 0xffffff );
            if (!selected.includes(intersects[0].object)) {
                selected.push(intersects[0].object);
            }
        }
        for (let i = 0; i < selected.length; i++) {
            selected[i].material.emissiveIntensity = 0.1;
        }
        render();
    }
    if (selected.length > 0) {
        $("#Config_button").show();
    } else {
        $("#Config_button").hide();
    }
    render();
}

let uid;

function ConfigureOpen() {
    resize();
    if (selected.length > 0) {
        config_open = true;
        render();
        let color = new THREE.Color("#" + selected[0].material.color.getHexString());
        PrevMat = new THREE.MeshPhysicalMaterial({color: color});

        PrevMat.side = THREE.DoubleSide;
        PrevMat.roughness = 0.6;
        PrevMat.metalness = 0;
        PrevMat.emissive = new THREE.Color(1, 1, 1);
        PrevMat.emissiveIntensity = 0;
        PrevMat.envMap = hdrCubeRenderTarget.texture;
        PrevMat.envMapIntensity = 1;
        $("#Configure").foundation("open");
        prev_controls.enabled = false;

        selectColorSwatch(selected[0]["details"]["color"]["catalogue"], selected[0]["details"]["color"]["swatch"]);
        $("#mat_clr_preview").css("background-color", "#" + selected[0].material.color.getHexString());
        open_material_color_swatches();
        setTimeout(function () {
            for (let i = 0; i < selected.length; i++) {
                let obj_loader = new THREE.OBJLoader();
                obj_loader.load(
                    selected[i]["defaults"]["path"],
                    function (object) {
                        object.traverse(function (child) {
                            if (child.type === "Mesh") {
                                child.name = "selected";
                                child.material = PrevMat;
                                PrevSeat.add(child);
                            }
                        });
                        prender();
                    }
                );
            }

            resize();
            prender();
        }, 100);
        setTimeout(function () {
            prender();
        }, 200);
        setTimeout(function () {
            uid = create_uid();
            $("#maps")
                .append("<canvas class='" + uid + " diffuse map' height='1024' width='1024'></canvas>")
                .append("<canvas class='" + uid + " bump map' height='1024' width='1024'></canvas>");
            current_diffusemap = $("." + uid + ".diffuse");
            current_bumpmap = $("." + uid + ".bump");
        }, 30);
        setTimeout(function () {
            if (selected[0].details.design) {
                design_v.val(selected[0].details.design_scale[0]);
                design_h.val(selected[0].details.design_scale[1]);
                selectQuiltSwatch(selected[0].details.design_swatch);
                current_design = true;
            } else {
                PrevMat.normalMap = normalmap;
                PrevMat.normalMap.repeat.set(0.75, 0.75);
                PrevMat.normalMap.needsUpdate = true;
                PrevMat.normalScale = new THREE.Vector2(1, 1);
                current_design = false;
            }
        }, 300)
    } else {
        alert("No Component Selected");
    }
}

let prender = function () {
    if (config_open) {
        requestAnimationFrame(prender);
        PrevRenderer.setSize(PrevWindow.width(), PrevWindow.height());
        PrevRenderer.aspect = (PrevWindow.width()) / PrevWindow.height();
        PrevCam.aspect = PrevWindow.width() / PrevWindow.height();
        // PrevCam.lookAt(new THREE.Vector3(0, 0, 0));
        PrevRenderer.render(PrevScene, PrevCam);
    }
};

function getUnselected() {

}

function ConfigureClose() {
    let PrevWindow = $("#preview");
    while (PrevSeat.children.length) {
        PrevSeat.remove(PrevSeat.children[0]);
    }
    $("#Configure").foundation("close");
    config_open = false;
    if (!current_design) {
        current_bumpmap.remove();
        current_diffusemap.remove();
    }
    BlankQuilt();
    // render();
}

function open_material_swatches() {
    $(".swatch_coll").hide();
    $("#material").show();
}

function open_design_swatches() {
    $(".swatch_coll").hide();
    $("#thread_color_controls").hide();
    $("#designs").show();
    $("#color_controls").hide();
    $("#design_controls").show();
    $("#current_preview").css("background-color", "#ffffff").css("border-color", "#000000");
    $("#attributes .collection").empty();
    $("#attributes .name").empty();
}

function open_material_color_swatches() {
    $(".swatch_coll").hide();
    $("#thread_color_controls").hide();
    $("#m_colors").show();
    $("#color_controls").show();
    $("#current_preview").empty().css("background-color", $("#mat_clr_preview").css("background-color")).css("border-color", "#ffffff");
    selectColorSwatch(selected[0]["details"]["color"]["catalogue"], selected[0]["details"]["color"]["swatch"]);
}

function open_thread_color_swatches() {
    $(".swatch_coll").hide();
    $("#t_colors").show();
    $("#color_controls").hide();
    $("#thread_color_controls").show();
}

function selectColorSwatch(catalogue, swatch) {
    let curr_color = colors[catalogue][swatch]["color"]["hex"];
    $("#mat_clr_preview").css("background-color", curr_color)
        .data("catalogue", catalogue)
        .data("swatch", swatch);
    $("#color_controls").show();
    $("#current_preview").css("background-color", curr_color);
    $("#attributes .collection").empty().append(catalogue);
    $("#attributes .name").empty().append(swatch);
    $("#mat_clr_catalogue").empty().append(catalogue);
    $("#mat_clr_swatch").empty().append(swatch);
    if (current_design) {
        let swatch = $("#des .prev").data("swatch");
        selectQuiltSwatch(swatch, curr_color);
    } else {
        PrevMat.color = new THREE.Color(curr_color);
        for (let i = 0; i < selected.length; i++) {
            selected[i].details["color"] = {"catalogue": catalogue, "swatch": swatch};
        }
    }
}

function selectThreadColorSwatch(color) {
    $("#thread_color_preview").css("background-color", thread_colors[color])
        .data("color", color)
        .data("color_value", thread_colors[color]);
    // $("#attributes .collection").empty().append(color);
    $("#attributes #thread_color_controls .name").empty().append(color);
    $("#thr_clr_swatch").empty().append(color);

    if (current_design) {
        let swatch = $("#des .prev").data("swatch");
        selectQuiltSwatch(swatch);
    }
}
selectThreadColorSwatch("Black");


function applyConfigurations() {
    let sel_color = "#" + PrevMat.color.getHexString();
    let current_color = $("#mat_clr_preview");
    let catalogue = current_color.data("catalogue");
    let swatch = current_color.data("swatch");

    for (let i = 0; i < selected.length; i++) {

        // Apply new material to all selected objects
        let temp_Mat = new THREE.MeshPhysicalMaterial({color: colors[catalogue][swatch]["color"]["hex"]});
        temp_Mat.roughness = 0.45;
        temp_Mat.metalness = 0;
        temp_Mat.emissive = new THREE.Color(1, 1, 1);
        temp_Mat.emissiveIntensity = 0;
        temp_Mat.envMap = hdrCubeRenderTarget.texture;
        temp_Mat.envMapIntensity = 1;
        selected[i].material = temp_Mat;

        selected[i].details.color = {"catalogue": catalogue, "swatch": swatch};

        if (current_design) {

            // Assign current color value to object for finalization
            selected[i].details.color_value = new THREE.Color(colors[catalogue][swatch]["color"]["hex"]);

            let v_scale = design_v.val() / 10;
            let h_scale = design_h.val() / 10;
            temp_Mat.color = new THREE.Color("#ffffff");
            temp_Mat.map = new THREE.CanvasTexture(current_diffusemap[0]);
            temp_Mat.map.wrapS = THREE.RepeatWrapping;
            temp_Mat.map.wrapT = THREE.RepeatWrapping;
            temp_Mat.map.repeat.set(h_scale, v_scale);
            temp_Mat.bumpMap = new THREE.CanvasTexture(current_bumpmap[0]);
            temp_Mat.bumpMap.wrapS = THREE.RepeatWrapping;
            temp_Mat.bumpMap.wrapT = THREE.RepeatWrapping;
            temp_Mat.bumpMap.repeat.set(h_scale, v_scale);
            temp_Mat.bumpScale = 0.5;
            temp_Mat.bumpMap.needsUpdate = true;
            temp_Mat.normalMap = undefined;
            selected[i].details.design = true;
            selected[i].details.design_swatch = $("#des .prev").data("swatch");
            selected[i].details.design_scale = [design_v.val(), design_h.val()];
        } else {
            selected[i].details.color_value = PrevMat.color;
            selected[i].details.design = false;


            temp_Mat.map = undefined;
            temp_Mat.normalMap = normalmap;
            temp_Mat.normalMap.repeat.set(0.75, 0.75);
            temp_Mat.normalMap.needsUpdate = true;
            temp_Mat.normalScale = new THREE.Vector2(0.5, 0.5);
        }
    }
    // console.log(selected);
    ConfigureClose();
    render();
}

function reset_all() {
    for (let i = 0; i < selectable.length; i++) {
        selectable[i].material = create_leather_mat(new THREE.Color("#" + selectable[i]["defaults"]["color_value"].getHexString()));
        selectable[i].details["color"] = selectable[i].defaults["color"];
        selectable[i].details["design"] = selectable[i].defaults["design"];
    }
    $("#Reset").foundation("close");
    render();

}

function selectQuiltSwatch(swatch) {
    current_design = true;
    $("#des .prev").data("swatch", swatch);

    let items = [];

    $.getJSON("resources/textures/quilts/" + quilts[swatch].path, function (json) {
        $.each(json, function (key, val) {
            items.push(val);
        });

        let current_color = $("#mat_clr_preview");
        let catalogue = current_color.data("catalogue");
        let swatch = current_color.data("swatch");

        let thread_color = $("#thread_color_preview").data("color_value");

        let curr_color = colors[catalogue][swatch]["color"]["hex"];


        $("#current_preview").empty()
            .append("<canvas id='des_small_preview_canvas' width='152' height='152'>");
        $("#des .prev").empty().append("<canvas id='design_prev_canvas' width='600' height='500'>");

        let prev_canvas = $("#des_small_preview_canvas");
        clearCanvas(prev_canvas);
        drawQuilt(prev_canvas, items, [152, 152], false, curr_color, thread_color);

        prev_canvas = $("#design_prev_canvas");
        clearCanvas(prev_canvas);
        drawQuilt(prev_canvas, items, [600, 600], false, curr_color, thread_color);


        let diffuse = current_diffusemap;
        clearCanvas(diffuse);
        drawQuilt(diffuse, items, [1024, 1024], false, curr_color, thread_color, true);
        let bump = current_bumpmap;
        clearCanvas(bump);
        drawQuilt(bump, items, [1024, 1024], true, "white", "black");
        items = undefined;
        PrevMat.normalMap = undefined;
        PrevMat.map = new THREE.CanvasTexture(current_diffusemap[0]);
        PrevMat.map.wrapS = THREE.RepeatWrapping;
        PrevMat.map.wrapT = THREE.RepeatWrapping;
        PrevMat.color = new THREE.Color("white");
        PrevMat.bumpMap = new THREE.CanvasTexture(current_bumpmap[0]);
        PrevMat.bumpMap.wrapS = THREE.RepeatWrapping;
        PrevMat.bumpMap.wrapT = THREE.RepeatWrapping;
        let v_scale = design_v.val() / 10;
        let h_scale = design_h.val() / 10;
        PrevMat.bumpMap.repeat.set(h_scale, v_scale);
        PrevMat.map.repeat.set(h_scale, v_scale);
        PrevMat.bumpScale = 0.5;
        PrevMat.map.needsUpdate = true;
        PrevMat.bumpMap.needsUpdate = true;
        PrevMat.needsUpdate = true;
        render();
    });
}

design_v_input.addEventListener("input", function (e) {
    UpdateDesignSize();
});
design_h_input.addEventListener("input", function (e) {
    UpdateDesignSize();
});

function UpdateDesignSize() {
    let v_scale = design_v.val() / 10;
    let h_scale = design_h.val() / 10;
    PrevMat.bumpMap.repeat.set(h_scale, v_scale);
    PrevMat.map.repeat.set(h_scale, v_scale);
    PrevMat.map.needsUpdate = true;
    PrevMat.bumpMap.needsUpdate = true;
    PrevMat.needsUpdate = true;
}

function BlankQuilt() {
    current_design = false;
    PrevMat.bumpMap = undefined;
    PrevMat.map = undefined;
    PrevMat.normalMap = normalmap;
    PrevMat.normalMap.repeat.set(0.75, 0.75);
    PrevMat.normalMap.needsUpdate = true;
    PrevMat.normalScale = new THREE.Vector2(1, 1);
    PrevMat.needsUpdate = true;
    let current_color = $("#mat_clr_preview");
    let catalogue = current_color.data("catalogue");
    let swatch = current_color.data("swatch");
    selectColorSwatch(catalogue, swatch);
    $("#design_controls").hide();
    $("#color_controls").show();

    $("#current_preview").empty();
    $("#des .prev").empty();
}


function openFinal() {

    // Set neutral and default scheme
    setNeutralScheme();
    setDefaultScheme();

    // Disable all camera movement controls
    controls.enabled = false;

    // Default color holding array
    let final_colors = [];
    // Get all color values as dictionary
    // Reset Material selection intensity, or parts of the seat are lighter than the rest
    for (let i = 0; i < selectable.length; i++) {
        final_colors.push(selectable[i].details.color);
        selectable[i].material.emissiveIntensity = 0;
    }

    // Config open so that rendering and selection are halted
    config_open = true;

    //open the final spec-sheet dialogue
    // $("#Final").foundation("open");

    // Set Image resolution for snapshot
    // renderer.setSize(768*2, 1024*2);
    // camera.aspect = 768 / 1024;
    renderer.setSize(1024*2, 1024*2);
    camera.aspect = 1024 / 1024;
    camera.updateProjectionMatrix();

    // First camera position for snapshot
    camera.position.set(150, 150, 150);
    // camera.lookAt(new THREE.Vector3(0, 50, 0));
    camera.lookAt(new THREE.Vector3(0, 50, -60));
    renderer.render(scene, camera);
    var img1 = new Image();
    img1.src = renderer.domElement.toDataURL();
    // add Image as a data source to spec-sheet
    $("#snap_1").empty().append(img1);

    // Second camera position for snapshot
    // camera.position.set(0, 150, 150);
    camera.position.set(0, 350, 150);
    camera.lookAt(new THREE.Vector3(0, 50, -60));
    renderer.render(scene, camera);
    var img2 = new Image();
    img2.src = renderer.domElement.toDataURL();
    // add Image as a data source to spec-sheet
    $("#snap_2").empty().append(img2);

    //make all objects invisible so that they can be rendered individually
    for (let i = 0; i < selectable.length; i++) {
        selectable[i].visible = false;
        selectable[i].material.side = THREE.FrontSide;
    }

    // Remove existing images from preview list
    let prev_div = $("#previews");
    prev_div.empty();
    // Hide baked mesh
    bakedmesh.visible = false;
    // set renderer size
    // renderer.setSize(384, 512);
    // camera.aspect = 768 / 1024;

    camera.updateProjectionMatrix();

    // Render each object individuaally
    for (let i = 0; i < selectable.length; i++) {
        prev_div.append("<div class='grid-x " + i + "'></div>");
        let curr_prev_div = $(".grid-x." + i);
        selectable[i].visible = true;

        curr_prev_div.append("<div class='color_swatch cell small-12'>Part : " + i + "</div>");

        // Take snapshot
        camera.position.set(100, 100, 150);
        camera.lookAt(new THREE.Vector3(0, 50, 0));
        renderer.render(scene, camera);
        var img_prev = new Image();
        img_prev.src = renderer.domElement.toDataURL();

        // add Image as a data source to spec-sheet
        var newDiv = document.createElement("div");
        newDiv.classList.add("cell", "small-6");
        newDiv.appendChild(img_prev);
        curr_prev_div.append(newDiv);


        camera.position.set(0, 150, 150);
        camera.lookAt(new THREE.Vector3(0, 50, 0));
        renderer.render(scene, camera);
        img_prev = new Image();
        img_prev.src = renderer.domElement.toDataURL();

        // add Image as a data source to spec-sheet
        newDiv = document.createElement("div");
        newDiv.classList.add("cell", "small-6");
        newDiv.appendChild(img_prev);
        curr_prev_div.append(newDiv);

        curr_prev_div.append("<div class='color_swatch cell small-12 grid-x'>" +
            "<div class='color_swatch_preview small-4'  style='background-color:#" + selectable[i].details.color_value.getHexString() + "!important'></div>" +
                "<div>" +
                    "<div class='color_swatch_catalogue'>" + selectable[i].details.color['catalogue'] + "</div>" +
                    "<div class='color_swatch_swatch'>" + selectable[i].details.color['swatch'] + "</div>" +
                "</div>" +
            "</div>");
        curr_prev_div.append("<div class='design_swatch cell small-12 " + i + "'></div>");
        if (selectable[i].details.design) {
            createFinalQuiltSwatch(selectable[i].details.design_swatch, i);
        }
        curr_prev_div.append("<hr class='cell small-12'>");
        curr_prev_div.append("<div class='color_swatch cell small-12 footer'>Saddles India Seat Configurator</div>");


        selectable[i].visible = false;
    }

    for (let i = 0; i < selectable.length; i++) {
        selectable[i].visible = true;
        selectable[i].material.side = THREE.DoubleSide;

    }
    // Reenable baked mesh
    bakedmesh.visible = true;
    $("#page").hide();
    $("#Final").show();
    setDateTime();
    // To reset all camera projection changes
    resize();
    // setTimeout(
    //     function () {
    //         // window.print();
    //
    //     }, 2000
    // )
}


function closeFinal() {
    $("#Final").hide();
    $("#page").show();
    controls.enabled = true;
    config_open = false;
    render()
}


function createFinalQuiltSwatch(swatch, id) {
    let items = [];
    $.getJSON("resources/textures/quilts/" + quilts[swatch].path, function (json) {
        $.each(json, function (key, val) {
            items.push(val);
        });
        let uid = create_uid();
        $("#previews .design_swatch." + id)
            .append("<canvas class='quilt' id='" + uid + "' width='200' height='200')'></canvas>");
        let canvas = "#" + uid;
        drawQuilt(canvas, items, [200, 200], false, "white", "black");
        items = undefined;
    });
}

function setDateTime() {
    var currentdate = new Date();
    var datetime = "Generated on: " + currentdate.getDate() + "/"
        + (currentdate.getMonth() + 1) + "/"
        + currentdate.getFullYear() + " @ "
        + currentdate.getHours() + ":"
        + currentdate.getMinutes() + ":"
        + currentdate.getSeconds();
    $("#datetime").empty().append(datetime);
}