$('#page').height($(document).height());

let config_open = false;


// ============================================================================
// ============================== RESIZE ======================================
// ============================================================================


window.addEventListener('resize', resize, true);

function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = (window.innerWidth) / window.innerHeight;
    camera.updateProjectionMatrix();

    $('#page').height(window.innerHeight);

    $(".inner-container").height($("#Configure").height());
    $(".inner-container .grid-x").height($("#Configure").height() - 60);

    if (window.innerWidth <= 1024) {
        $(".inner-container #pallets").height($("#Configure").height() - 60 - 300);
        $(".inner-container #parameters").height($("#Configure").height() - 60 - 300);
    } else {
        $(".inner-container #pallets").height($("#Configure").height() - 60);
        $(".inner-container #parameters").height($("#Configure").height() - 60);
    }

    if (config_open) {
        PrevRenderer.setSize(PrevWindow.width(), PrevWindow.height());
        PrevCam.aspect = (PrevWindow.width()) / PrevWindow.height();
        PrevCam.updateProjectionMatrix();
        PrevRenderer.aspect = (PrevWindow.width()) / PrevWindow.height();
        PrevRenderer.updateProjectionMatrix = true;
        PrevRenderer.toneMappingExposure = 1.0;
        $('#parameters #swatches').height($('#parameters').height() - 200);
        $('#parameters #attributes').height(200);

    }

    if (window.innerWidth > 800) {
        window_compatible()
    } else if (window.innerHeight > 600) {
        window_compatible()
    }
    if (window.innerWidth < 800) {
        window_too_small()
    } else if (window.innerHeight < 600) {
        window_too_small()
    }
    render()
}

function window_too_small() {
    $("#min_size").show();
}

function window_compatible() {
    $("#min_size").hide();
}


// ============================================================================
// ==============================VARIABLES=====================================
// ============================================================================

// Setting local variables
// These will be served from the django RESTFramework in production.
let data_path = "resources/data/";

// Default path defined to a single seat
// Folder with SDC file that contains data related to all objects.

let path = {
    "vwt6": "resources/mesh/VW_T6/",
    "plane": "resources/mesh/plane/",
    "scross": "resources/mesh/Suzuki_SCross/",
    "dmax": "resources/mesh/Isuzu_DMAX/",
    "jazz": "resources/mesh/Honda_Jazz/",
    "tucson": "resources/mesh/Hyundai_Tucson/",
    "qasqai": "resources/mesh/Nissan_Qasqai/",
    "ecosport": "resources/mesh/Ford_EcoSport/",
    "ertiga": "resources/mesh/Maruti_Suzuki_ERTIGA/",
    "current": "resources/mesh/Current/",
    "patrol": "resources/mesh/Nissan_Patrol/"
};
let params = (new URL(document.location)).searchParams;
let name = params.get("car");

let mesh_path = path[name];
let car_name, manufacturer_name;

// HDRI lightmap
let hdrCubeRenderTarget;


// Global variable to store all designs
let designs;

// Global arrays that are used to Modify objects
let selectable = [];
let selected = [];
let leatherColors = [];

// Global arrays that are used to Modify objects
let current_bumpmap, current_diffusemap;



// Design Scale
let design_v = $("#design_v_input");
let design_h = $("#design_h_input");



// ============================================================================
// ==============================THREEjs=======================================
// ============================================================================
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, canvas: MainCanvas});
renderer.setSize(window.innerWidth, window.innerHeight);
// renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMapping = THREE.LinearToneMapping;
// renderer.toneMapping = THREE.ReinhardToneMapping;
// renderer.toneMapping = THREE.Uncharted2ToneMapping;
// renderer.toneMapping = THREE.CineonToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.gammaFactor = 1;
renderer.gammaInput = true;
renderer.gammaOutput = true;
renderer.physicallyCorrectLights = true;

let full_seat = new THREE.Group();
full_seat.name = "Full Seat";

let seat = new THREE.Group();
seat.name = "Seat Components";
full_seat.add(seat);
scene.add(full_seat);

camera.lookAt(new THREE.Vector3(0, 50, 0));
camera.position.set(250, 250, 350);

let PrevWindow = $("#preview");
let PrevScene = new THREE.Scene();
let PrevRenderer = new THREE.WebGLRenderer({antialias: true, alpha: true, canvas: PreviewCanvas});
let PrevSeat = new THREE.Group();
PrevSeat.name = "Preview Components";
PrevScene.add(PrevSeat);
let PrevCam = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
PrevCam.lookAt(new THREE.Vector3(0, 0, 0));
PrevCam.position.set(20, 100, 80);

// PrevCam.position.set(250, 250, 350);
// PrevRenderer.toneMappingExposure = 1.0;


// Orbit Controls
// ============================================================================
let controls = new THREE.OrbitControls(camera);
controls.minDistance = 50;
controls.maxDistance = 200;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
// controls.dampingFactor = 0.2;
controls.minAzimuthAngle = -Math.PI / 2;
controls.maxAzimuthAngle = Math.PI / 2;
// controls.autoRotate = true;
// controls.autoRotateSpeed = 0.01;
controls.target.set(0, 50, 0);
// controls.enableDamping = true;
controls.update();

let prev_controls = new THREE.OrbitControls(PrevCam);
prev_controls.minDistance = 50;
prev_controls.maxDistance = 200;
prev_controls.minPolarAngle = 0;
prev_controls.maxPolarAngle = Math.PI / 2;
// prev_controls.dampingFactor = 0.2;
prev_controls.minAzimuthAngle = -Math.PI / 2;
prev_controls.maxAzimuthAngle = Math.PI / 2;
// controls.autoRotate = true;
// controls.autoRotateSpeed = 0.01;
prev_controls.target.set(0, 50, 0);
// controls.enableDamping = true;
prev_controls.update();
prev_controls.enabled = false;

$("#Configure")
    .mouseenter(function () {
        controls.enabled = false;
    })
    .mouseleave(function () {
        controls.enabled = true;
    });

PrevWindow
    .mouseenter(function () {
        prev_controls.enabled = true;
    })
    .mouseleave(function () {
        prev_controls.enabled = false;
    });

// Preview Material
// ============================================================================
let PrevMat;

// Lights
// ============================================================================
// let light1 = new THREE.PointLight(0xffffff, 1, 100);
// light1.position.set(80, 20, 20);
// scene.add(light1);
//
// let light2 = new THREE.PointLight(0xffffff, 1, 100);
// light2.position.set(-20, 100, 50);
// scene.add(light2);

let light1 = new THREE.PointLight(0xffffff, 200);
light1.position.set(0, 200, 250);
scene.add(light1);

let light2 = new THREE.PointLight(0xffffff, 50);
light2.position.set(-100, 80, 0);
scene.add(light2);

let light3 = new THREE.PointLight(0xffffff, 50);
light3.position.set(80, 100, 30);
scene.add(light3);

// var pointLightHelper = new THREE.PointLightHelper( light3, 1 );
// scene.add( pointLightHelper );

let plight1 = new THREE.PointLight(0xddddff, 0.7, 100);
plight1.distance = 0;
plight1.decay = 2;
plight1.position.set(100, 200, 100);
PrevScene.add(plight1);

let plight2 = new THREE.PointLight(0xffdddd, 0.7, 100);
plight2.distance = 0;
plight2.decay = 2;
plight2.position.set(-40, 50, 80);
PrevScene.add(plight2);
// Env Map
// ============================================================================

let genCubeUrls = function (prefix, postfix) {
    return [
        prefix + 'px' + postfix, prefix + 'nx' + postfix,
        prefix + 'py' + postfix, prefix + 'ny' + postfix,
        prefix + 'pz' + postfix, prefix + 'nz' + postfix
    ];
};

let hdrUrls = genCubeUrls('resources/hdri/', '.hdr');


new THREE.HDRCubeTextureLoader().load(THREE.UnsignedByteType, hdrUrls, function (hdrCubeMap) {
    let pmremGenerator = new THREE.PMREMGenerator(hdrCubeMap);
    pmremGenerator.update(renderer);
    let pmremCubeUVPacker = new THREE.PMREMCubeUVPacker(pmremGenerator.cubeLods);
    pmremCubeUVPacker.update(renderer);
    hdrCubeRenderTarget = pmremCubeUVPacker.CubeUVRenderTarget;
    hdrCubeMap.dispose();
    pmremGenerator.dispose();
    pmremCubeUVPacker.dispose();
});


let animate = function () {

    requestAnimationFrame(animate);

    // controls.target.set(0, 50, 0);
    // controls.update();
    // console.log("test");
    renderer.render(scene, camera);
};

animate();

// controls.addEventListener('change', render);
//
function render() {

    if (config_open) {
        PrevRenderer.render(PrevScene, PrevCam);
    } else {
        renderer.render(scene, camera);
    }
}


// Color Swatches
// ============================================================================

for (let i in colors) {
    $("#m_colors").append("<p>" + i + "</p>");
    for (let j in colors[i]) {
        $("#m_colors").append("<div class='color_swatch'	style='background-color: " + colors[i][j]["color"]["hex"] + "' data-color='" + colors[i][j]["color"]["hex"] + "' onclick='selectColorSwatch(\"" + i + "\", \"" + j + "\")'></div>"
        )
    }
    $("#m_colors").append("<hr>")
}

for (let i in thread_colors) {
    $("#t_colors").append("<div class='color_swatch'	style='background-color: " + thread_colors[i] + "' data-color='" + thread_colors[i] + "' onclick='selectThreadColorSwatch(\"" + i + "\")'></div>"
    )
}

// Quilt Swatches
// ============================================================================
function CreateAllQuiltSwatches() {
    $("#designs")
        .append("<canvas class='quilt' id='blank' width='100' height='100'" +
            " onclick='BlankQuilt()'></canvas>");
    for (let quilt in quilts) {
        createQuiltSwatch(quilt);
    }
}
CreateAllQuiltSwatches();

function createQuiltSwatch(swatch) {
    let items = [];
    $.getJSON("resources/textures/quilts/" + quilts[swatch].path, function (json) {
        $.each(json, function (key, val) {
            items.push(val);
        });
        // console.log(json);
        $("#designs")
            .append("<canvas class='quilt' id='" + swatch + "' width='100' height='100'" +
                " onclick='selectQuiltSwatch(\"" + swatch + "\")'></canvas>");
        let canvas = "#" + swatch;
        drawQuilt(canvas, items, [100, 100], false, "white", "black");
        items = undefined;
    });
}


function drawQuilt(canvas, data, scale = [100, 100], bump = false, color = "white", stroke = "white", stitch = false) {
    let items = data;
    let n = $(canvas);
    clearCanvas(n);
    let ntx = n[0].getContext("2d");
    ntx.fillStyle = color;
    ntx.fillRect(0, 0, scale[0], scale[1]);

    ntx.lineJoin = 'round';
    ntx.shadowColor = stroke;
    ntx.lineCap = 'round';
    for (i = 0; i < items.length; i++) {
        ntx.moveTo(items[i][0][0] / 1024 * scale[0], items[i][0][1] / 1024 * scale[1]);
        for (j = 1; j < items[i].length; j++) {
            ntx.lineTo(items[i][j][0] * scale[0] / 1024, items[i][j][1] * scale[1] / 1024);
        }
    }
    if (bump) {
        let max = 20;
        let compatibility = 255/max;
        for (let i = 0; i < max+1; i++) {
            ntx.lineWidth = 3;
            let line_color = 255 - i*compatibility;
            ntx.strokeStyle = `rgb(
                ${Math.floor(line_color)},
                ${Math.floor(line_color)},
                ${Math.floor(line_color)})`;
            ntx.shadowBlur = ((max*compatibility +1) - i*compatibility)/3;
            // console.log(line_color, ntx.strokeStyle, ntx.lineWidth, i*compatibility, ntx.shadowBlur);
            ntx.stroke();
        }
    } else if (stitch) {
        ntx.lineWidth = 3;
        ntx.setLineDash([20, 8]);
    } else {
        ntx.lineWidth = 1;
    }
    ntx.strokeStyle = stroke;
    ntx.stroke();
}

function clearCanvas(canvas) {
    let n = $(canvas)[0];
    let ntx = n.getContext("2d");
    ntx.clearRect(0, 0, n.width, n.height);
    ntx.beginPath();
}


let bakedmesh;
// Load the entire seat from the given path
// ============================================================================
function CompileMesh() {
    $.getJSON(mesh_path + "index.sdc", function (json) {
        let total_mesh = json["geo"].length;

        // Loading the baked in Meshes first, they come with material
        let gltf_loader = new THREE.GLTFLoader();
        car_name = json["model"];
        manufacturer_name = json["manufacturer"];
        $(".Car_Name").append(manufacturer_name + " - " + car_name);
        $(".lds-spinner").show();

        gltf_loader.load(
            mesh_path + "geo/" + json["gltf"],
            function (gltf) {
                $(".lds-spinner").show();
                bakedmesh = gltf.scene;
                full_seat.add(bakedmesh);
                applyEnvMapToGltf()
                setTimeout( function () {
                    $(".lds-spinner").hide();
                }, 2000);

            }
        );
        for (let i = 0; i < total_mesh; i++) {
            let obj_loader = new THREE.OBJLoader();
            let j = i;
            let catalogue = json["geo"][j]["color"]["catalogue"];
            let swatch = json["geo"][j]["color"]["swatch"];
            let color = new THREE.Color(colors[catalogue][swatch]["color"]["hex"]);
            obj_loader.load(
                mesh_path + "geo/" + json["geo"][i]["geo"],
                function (object) {
                    $(".lds-spinner").show();
                    object.traverse(function (child) {
                        if (child.type === "Mesh") {
                            child.material = create_leather_mat(color);
                            child.defaults = {};
                            child.defaults["path"] = mesh_path + "geo/" + json["geo"][i]["geo"];
                            child.defaults["color"] = json["geo"][j]["color"];
                            child.defaults["color_value"] = color;
                            child.defaults["design"] = json["geo"][j]["design"];
                            child.details = {};
                            child.details["color"] = json["geo"][j]["color"];
                            child.details["color_value"] = color;
                            child.details["design"] = json["geo"][j]["design"];
                            selectable.push(child);
                            seat.add(child);
                        } else if (child.type === "LineSegments") {
                            console.log("child");
                            child.material = create_leather_mat(color);
                        }
                    });
                    // Render each object as it gets loaded.
                    render();
                    setTimeout( function () {
                        $(".lds-spinner").hide();
                    }, 2000);
                }
            );
        }
    });
}

CompileMesh();


function setDefaultScheme() {
    $("body").addClass("default").removeClass("dark").removeClass("light");
    $("#light_controls .button.primary.bg").removeClass("primary").addClass("secondary");
    $("#light_controls .button.default.bg").addClass("primary").removeClass("secondary");
}

function setDarkScheme() {
    $("body").addClass("dark").removeClass("default").removeClass("light");
    $("#light_controls .button.primary.bg").removeClass("primary").addClass("secondary");
    $("#light_controls .button.dark.bg").addClass("primary").removeClass("secondary");
}

function setGreyScheme() {
    $("body").addClass("light").removeClass("dark").removeClass("default");
    $("#light_controls .button.primary.bg").removeClass("primary").addClass("secondary");
    $("#light_controls .button.grey.bg").addClass("primary").removeClass("secondary");

}

function setWarmScheme() {
    light1.color = new THREE.Color("#ffffaa");
    light2.color = new THREE.Color("#ffaaaa");
    light3.color = new THREE.Color("#ffaa88");
    $("#light_controls .button.primary.lt").removeClass("primary").addClass("secondary");
    $("#light_controls .button.warm.lt").addClass("primary").removeClass("secondary");
}
function setNeutralScheme() {
    light1.color = new THREE.Color("#ffffff");
    light2.color = new THREE.Color("#ffffff");
    light3.color = new THREE.Color("#ffffff");
    $("#light_controls .button.primary.lt").removeClass("primary").addClass("secondary");
    $("#light_controls .button.neutral.lt").addClass("primary").removeClass("secondary");
}
function setCoolScheme() {
    light1.color = new THREE.Color("#aaffff");
    light2.color = new THREE.Color("#aaaaff");
    light3.color = new THREE.Color("#88aaff");
    $("#light_controls .button.primary.lt").removeClass("primary").addClass("secondary");
    $("#light_controls .button.cool.lt").addClass("primary").removeClass("secondary");
}

setDarkScheme();
setNeutralScheme();

