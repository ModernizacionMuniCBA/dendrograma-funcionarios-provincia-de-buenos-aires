$(function() {
    startSpinner("dendogram");
    funcionariosTask.then(dendogram).then(stopSpinner).catch(function (error) {
        throw error;
    });
});

var secreatariesSeparator = "-";

function dendogram(funcionarios) {
    var selectedradius = getParameterByName("radio");
    if (!selectedradius) {
        radius = window.innerWidth / 2;
    } else {
        radius = selectedradius;
    }

    var results = generateTree(funcionarios.results, null, 0)[0];
    var directors = getSubordinates(funcionarios.results, results.data.cargo.id);
    var secretaries = directors.map(function (p) {
        return p.cargo.oficina
    }).sort();

    var secretariesAux = new Array();
    secretaries.forEach(function (value, i) {
        secretariesAux.push(i);
    });

    var filterSecretaries = getParameterByName("secretarias");
    if (filterSecretaries) {
        var ids = filterSecretaries.split(secreatariesSeparator);
        filterSecretaries = new Array();
        ids.forEach(function (o) { //id -> nombre
            filterSecretaries.push(secretaries[o]);
        });
        var filtered = results.children.filter(function (director) {
            return filterSecretaries.indexOf(director.office) >= 0;
        });
        if (filtered) {
            if (filtered.length == 1) {
                results = filtered[0];
            } else {
                results.children = filtered;
            }
        }
    }

    var cluster = d3.layout.cluster()
        .size([360, radius - 120]);

    var diagonal = d3.svg.diagonal.radial()
        .projection(function (d) {
            return [d.y, d.x / 180 * Math.PI];
        });

    var svg = d3.select("#dendogram").append("svg")
        .attr("width", radius * 2)
        .attr("height", radius * 2)
        .append("g")
        .attr("transform", "translate(" + radius + "," + radius + ")");

    var nodes = cluster.nodes(results);

    var link = svg.selectAll("path.link")
        .data(cluster.links(nodes))
        .enter().append("path")
        .attr("class", "link")
        .attr("stroke", function (d) {
            return colours[secretaries.indexOf(d.target.office)];
            // return d3.scale.category20().range()[secretaries.indexOf(d.target.office)];
        })
        .attr("d", diagonal);

    var node = svg.selectAll("g.node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
        });

    var div = d3.select("#dendogram").append("div")
        .attr("class", "tooltip")
        .style("opacity", 1e-6)
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

    node.append("a")
        .attr("xlink:href", personLink)
        .append("circle")
        .attr("r", function (d) {
            var weight = d.data.cargo.categoria.orden;
            if (weight) {
                return (110 - weight) * 0.15;
            }
            return (20 - d.size) / 4;
        })
        .attr("stroke", function (d) {
            return (d.gender == "M") ? "DarkBlue" : "DeepPink";
        })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseout", mouseout);

    node.append("a")
        .attr("xlink:href", personLink)
        .append("text")
        .attr("dy", ".31em")
        .attr("text-anchor", function (d) {
            return d.x < 180 ? "start" : "end";
        })
        .attr("transform", function (d) {
            return d.x < 180 ? "translate(15)" : "rotate(180)translate(-15)";
        })
        .text(function (d) {
            return d.name;
        })
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseout", mouseout);

    function mouseover() {
        div.transition()
            .duration(300)
            .style("opacity", 1);
    }

    function mousemove(d) {
        div
            .html("<div class='img'><img style='max-height:100px;max-width:150px' src='" + d.photo + "'/></div><br/>" +
                "<b>" + d.name + "</b><br/>" + d.rank + "<br/><br/><i>" + d.data.cargo.oficina + "</i>")
            .style("left", (d3.event.pageX ) + "px")
            .style("top", (d3.event.pageY) + "px");
    }

    function mouseout() {
        div.transition()
            .duration(300)
            .style("opacity", 1e-6);
    }

    function personLink(d) {
        if (d.link) {
            return getApiUrl() + d.link;
        }
        return "#";
    }

    d3.select(self.frameElement).style("height", radius * 2 + "px");

    if (getParameterByName("select")) {
        loadFilters(secretaries, filterSecretaries, selectedradius);
    }
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function loadFilters(secretaries, current, selectedradius) {
    var s2 = $("<select/>", {class: "js-example-basic-multiple", multiple: "multiple"});
    secretaries.forEach(function (secretary, i) {
        $("<option />", {value: i, text: secretary}).appendTo(s2);
    });
    if (current) {
        var currentVals = new Array();
        current.forEach(function (o) { //name -> id
            currentVals.push(secretaries.indexOf(o));
        });
        s2.val(currentVals)
    }
    s2.change(function () {
        var secretariesAux = $(this).val();
        var params = new Object();
        if (selectedradius) {
            params.radio = selectedradius;
        }
        if (getParameterByName("select")) {
            params.select = 1;
        }
        if (secretariesAux) {
            if(secretariesAux.length === 1) {
                params.secretarias = secretariesAux[0];
            } else {
                params.secretarias = "";
                secretariesAux.forEach(function (o) {
                    if(o === secretariesAux[0]) {
                        params.secretarias = o; //first element
                    } else {
                        params.secretarias = params.secretarias + secreatariesSeparator + o;
                    }
                });
            }
        }
        window.location.href = "?" + $.param(params);
    });
    s2.appendTo("#filters");
    $(".js-example-basic-multiple").select2();
}

var colours = ["#0a72ff", "#1eff06", "#ff1902", "#2dfefe", "#827c01", "#fe07a6", "#a8879f", "#fcff04", "#c602fe", "#16be61", "#ff9569", "#05b3ff", "#ecffa7", "#3f8670", "#e992ff", "#ffb209", "#e72955", "#83bf02", "#bba67b", "#fe7eb1", "#7570c1", "#85bfd1", "#f97505", "#9f52e9", "#8ffec2", "#dad045", "#b85f60", "#fe4df2", "#75ff6c", "#78a55a", "#ae6a02", "#bebeff", "#ffb3b3", "#a4fe04", "#ffc876", "#c548a7", "#d6492b", "#547da7", "#358b06", "#95caa9", "#07b990", "#feb6e9", "#c9ff76", "#02b708", "#7b7a6e", "#1090fb", "#a46d41", "#09ffa9", "#bb76b7", "#06b5b6", "#df307c", "#9b83fd", "#ff757c", "#0cd9fd", "#bdba61", "#c89d26", "#91df7e", "#108c49", "#7b7d40", "#fdd801", "#048699", "#fc9d40", "#ff0f3b", "#87a72c", "#a25cc2", "#b95a82", "#bb8a80", "#cce733", "#f7b58d", "#adaaab", "#c141c8", "#08fbd8", "#ff6de4", "#c26040", "#bb9bf6", "#b08f44", "#6d96de", "#8dcaff", "#5be51c", "#68c948", "#ff5fb8", "#7f9872", "#9aa5ca", "#bad292", "#c32fe4", "#fc92df", "#e08eaa", "#fd0afd", "#2daad4", "#d96d2a", "#69e0c9", "#ce4b69", "#79ca8d", "#6e8e9a", "#ffec83", "#de0fb5", "#8471a2", "#bbd766", "#e94805", "#06ff54", "#9cf046", "#6a63ff", "#05e774", "#e38c7b", "#f6ff75", "#3cda96", "#d68e4b", "#d774fe", "#feca4c", "#80ff95", "#5571e1", "#6da9a1", "#a5a20d", "#d5484a", "#688326", "#e7d08f", "#4e8653", "#5cad4c", "#c19bcf", "#ff0e76", "#d3ff0b", "#a66877", "#6ddde3", "#a544fe", "#c2fdb5", "#8f7955", "#fd735b", "#8497fd", "#fd919d", "#fdf346", "#fe5581", "#fd4e50", "#0ca82e", "#d4a8b2", "#d14e91", "#0d9069", "#0c8bca", "#fd9403", "#d5b401", "#adc32e", "#efacfe", "#9da668", "#57b093", "#787791", "#ff6f39", "#9e790a", "#d18903", "#abb49a", "#a06790", "#cf70cb", "#c8fe96", "#488834", "#dcbf55", "#e82f23", "#9a90d5", "#9cd54d", "#c7936c", "#05dc4a", "#98f372", "#907275", "#167dcf", "#db2b9f", "#16b16e", "#49a802", "#66cd1d", "#905fdc", "#cecd02", "#a376ca", "#939540", "#a7e103", "#d9ac6e", "#099334", "#db7701", "#3facbd", "#a0cb76", "#6aa3d5", "#dcaf98", "#b6692e", "#a76a59", "#04908e", "#d771ab", "#a69683", "#8268d0", "#72ab79", "#f70c8b", "#ebaa4c", "#9ce7b8", "#5f837a", "#df708c", "#ad9c32", "#39ffc2", "#d28388", "#79d5f9", "#e35eff", "#ffaf72", "#55e0b3", "#e8c0fe", "#6a69ed", "#fe07d3", "#0c86af"];
