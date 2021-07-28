$('#page').height($(document).height());

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(45, (window.innerWidth) / window.innerHeight, 0.1, 1000);
let renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, canvas: MainCanvas});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMappingExposure = 1.0;

// ============================================================================
// ============================== RESIZE ======================================
// ============================================================================


window.addEventListener('resize', resize, true);

function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = (window.innerWidth) / window.innerHeight;
    camera.updateProjectionMatrix();
    $('#page').height(window.innerHeight);
    $('#parameters #swatches').height($('#parameters').height()-200);
    $('#parameters #attributes').height(200);
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
}

function window_too_small() {
    $("#min_size").show();
}

function window_compatible() {
    $("#min_size").hide();
}

resize();

// ============================================================================
// ==============================VARIABLES=====================================
// ============================================================================

// Setting local variables
// These will be served from the django RESTFramework in production.
let data_path = "resources/data/";

// Default path defined to a single seat
// Folder with SDC file that contains data related to all objects.
// let mesh_path = "resources/mesh/Honda_Amaze/";
// let mesh_path = "resources/mesh/Suzuki_Swift/";
let mesh_path = "resources/mesh/Suzuki_SCross/";

// HDRI lightmap
let hdrCubeRenderTarget;
// Global variable to store all colors
let colors;
// Global variable to store all designs
let designs;

// Global variables that hold all the required info for each DOM session
let selectable, selected;

// Global arrays that are used to Modify objects
selectable = [];
selected = [];
let leatherColors = [];


// ============================================================================
// ==============================THREEjs=======================================
// ============================================================================

let full_seat = new THREE.Group();
full_seat.name = "Full Seat";
let seat = new THREE.Group();
seat.name = "Seat Components";
full_seat.add(seat);
scene.add(full_seat);

camera.lookAt(new THREE.Vector3(0, 50, 0));
camera.position.set(0, 50, 200);

// Orbit Controls
// ============================================================================
let controls = new THREE.OrbitControls(camera);
controls.minDistance = 50;
controls.maxDistance = 200;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2;
controls.dampingFactor = 0.2;
controls.minAzimuthAngle = -Math.PI / 2;
controls.maxAzimuthAngle = Math.PI / 2;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.01;
controls.target.set(0, 50, 0);
controls.enableDamping = true;
controls.update();


$("#Configure")
    .mouseenter(function () {
        controls.enabled = false;
    })
    .mouseleave(function () {
        controls.enabled = true;
    });

// Lights
// ============================================================================
let light1 = new THREE.PointLight(0xffffff, 1, 100);
light1.position.set(80, 20, 20);
scene.add(light1);

let light2 = new THREE.PointLight(0xffffff, 1, 100);
light2.position.set(-20, 100, 50);
scene.add(light2);


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

    controls.target.set(0, 50, 0);
    controls.update();

    renderer.render(scene, camera);
};


// Color Swatches
// ============================================================================

$.getJSON(data_path + "colors.json", function (json) {
    colors = json;
    for (let i in json) {
        $("#l_colors").append("<p>" + i + "</p>");
        for (let j in json[i]) {
            $("#l_colors").append("<div class='color_swatch'	style='background-color: " + json[i][j]["color"]["hex"] + "' data-color='" + json[i][j]["color"]["hex"] + "' onclick='selectColorSwatch(\"" + i + "\", \"" + j + "\")'></div>"
            )
        }
        $("#l_colors").append("<hr>")
    }
});


$.getJSON("resources/textures/quilts/quilts.json", function (data) {
    quilts = data;
    for (let i in data) {
        createQuiltSwatch(i);
    }
});

function createQuiltSwatch(swatch) {
    let items = [];
    $.getJSON("resources/textures/quilts/" + quilts[swatch].path, function (json) {
        $.each(json, function (key, val) {
            items.push(val);
        });
        // console.log(json);
        $("#designs").append("<canvas class='quilt' id='" + swatch + "' width='100' height='100' onclick='selectQuiltSwatch(\"" + swatch + "\")'></canvas>");
        let canvas = "#" + swatch;
        drawQuilt(canvas, items, [100, 100], false, "white", "black");
        items = undefined;
    });
}


function drawQuilt(canvas, data, scale = [100, 100], bump = false, color="white", stroke="white", stitch=false) {
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
        let max = 8;
        for (let i = 0; i < max; i++) {
            ntx.lineWidth = max - i;
            ntx.strokeStyle = `rgb(
                ${Math.floor(max - i)},
                ${Math.floor(max - i)},
                ${Math.floor(max - i)})`;
            ntx.shadowBlur = 20 * i;
            ntx.stroke();
        }
    } else if (stitch) {
        ntx.setLineDash([12, 4]);
    }
    ntx.lineWidth = 1;
    ntx.strokeStyle = stroke;
    ntx.stroke();
}

function clearCanvas(canvas) {
    let n = $(canvas)[0];
    let ntx = n.getContext("2d");
    console.log(n.width);
    ntx.clearRect(0, 0, n.width, n.height);
    ntx.beginPath();
}
