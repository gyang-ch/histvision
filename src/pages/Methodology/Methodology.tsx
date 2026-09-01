import { FlipLink } from '../../components/FlipLink'
import './Methodology.css'

export function MethodologyPage() {
  return (
    <article className="meth-page">
      <header className="meth-header">
        <h2 className="meth-title">Methodology</h2>
        <div className="meth-rule" />
      </header>

      <div className="meth-body">
        <p>This website is designed to explore the history of botany through digitised historical books. The project investigates how computer-assisted techniques can enhance the analysis of historical botanical texts and images at scale by utilising contemporary AI models and digital infrastructures, enabling patterns of visual and textual comparison that would be difficult to identify through traditional archival methods alone.</p>

        <p>The design of the website draws together several methodological strands introduced throughout the module. The processes of transcription, object detection, and dataset construction reflect data science approaches to humanities materials, transforming archival images into computationally analysable capta. Automated analysis across multiple texts enables forms of macro-analysis associated with distant reading, extending these approaches into visual as well as textual domains. Finally, the Geographical Distribution page engages spatial humanities methodologies, demonstrating how mapping functions not only as a visualisation tool but also as an interpretative framework. In this context, digital technologies are not simply supplementary tools but methodological necessities, enabling forms of scale, comparison, and pattern recognition that would be impractical through traditional close reading alone.</p>

        <p>The website uses IIIF to retrieve high-resolution images directly from museum and library servers, which are displayed via the open-source viewer OpenSeadragon. Images are retrieved via IIIF links rather than hosted locally in order to avoid redundant data storage and to respect institutional stewardship of digital collections, which reflects both the principles of IIIF and broader Digital Humanities commitments to accessibility and decentralised data management by avoiding the need to locally store large image collections. However, it also exposes the project's dependence on institutional infrastructures, raising questions about sustainability and platform longevity.</p>

        <p>A different storage strategy was adopted for the illustration dataset displayed in the Illustrations page. While original book pages are accessed via IIIF links, the cropped plant illustrations are stored in Azure Blob Storage because they constitute derived research outputs generated through annotation and YOLO-based extraction rather than institutional source materials. Hosting them independently enables reuse in future analytical workflows and avoids the computational inefficiency of repeatedly retrieving and cropping IIIF images at runtime. This distinction illustrates how Digital Humanities projects often negotiate between decentralised cultural heritage infrastructures and researcher-controlled data environments, depending on whether materials function as archival sources or newly produced scholarly datasets.</p>

        <p>To enable textual analysis, the project uses the open-source OCR/HTR engine Kraken, on which the widely used transcription platform eScriptorium is built, and a vision-language model Qwen-VL (accessed through Together AI's API service) to transcribe historical book images. While Kraken is a more traditional, scholarly-oriented tool for transcription, the use of Qwen reflects what Smits and Wevers <span className="meth-citation">(2023)</span> describe as a "multimodal turn" in Digital Humanities, in which machine learning models for both textual and visual analysis are often used. Qwen-VL demonstrated stronger transcription performance than Kraken. The selection of Qwen-VL was informed by considerations of both performance and computational cost, as it combines competitive multimodal performance with relatively low operational expense and strong results in historical OCR, particularly for premodern Chinese texts. Its adoption by projects such as Nanjing University's Digital iLab further reflects the model's growing relevance within digital humanities research.</p>

        <p>In addition, the project incorporates a fine-tuned YOLO model for detecting plant illustrations in book images. The YOLO model is a state-of-the-art open-source model for object detection. It has been increasingly used in Digital Humanities research. For instance, Du, Le, and Honig <span className="meth-citation">(2024)</span> use YOLO to identify recurring photographs in twentieth-century newspaper archives. YOLO was originally developed to detect everyday objects in photographs, such as people and vehicles. To adapt it for illustrations in historical books, I first manually annotated 1,360 images using bounding boxes on Roboflow <span className="meth-citation">(Roboflow, Inc., n.d.)</span>, and then fine-tuned a YOLO model based on the annotated dataset. The annotation process represents an interpretative act, since decisions about what qualifies as an "illustration" shaped the resulting dataset and the analytical outcomes.</p>

        <figure className="meth-figure">
          <img
            src="/figure1.jpeg"
            alt="Annotation workflow in Roboflow"
            className="meth-figure-img"
          />
          <figcaption className="meth-figure-caption">
            Figure 1: Annotation workflow in Roboflow
          </figcaption>
        </figure>

        <p>By automating transcription and illustration detection, the project aligns with macro-analytical approaches that shift interpretation from individual texts toward patterns across collections.</p>

        <p>The website includes an <FlipLink to="/illustrations">Illustrations</FlipLink> page that presents plant illustrations extracted and cropped from digitised book pages by the YOLO model. While the <FlipLink to="/library">Library</FlipLink> and <FlipLink to="/ai-hub">AI Hub</FlipLink> pages expose the analytical workflow and allow users to engage with the research process, this page presents the curated dataset visually, focusing on presenting the results rather than methodology. The difference reflects the design choices of DH projects: whether digital cultural resources should prioritise transparency of scholarly process or the presentation of refined cultural artefacts. As Johanna Drucker argues, graphical displays in humanities contexts are interpretative constructions shaped by scholarly choices and assumptions rather than neutral representations of data <span className="meth-citation">(Drucker, 2011)</span>. The Illustrations function as capta rather than neutral data; they materialise a series of computational and curatorial decisions that transform machine-generated outputs into cultural knowledge. I have also considered how to integrate them to allow users to move from exploratory research environments to curated outputs.</p>

        <p>The website also includes a Geographical Distribution page, where kepler.gl is used to map plant distributions, demonstrating the potential of spatial humanities approaches. I initially considered visualising the geographical distribution of plants depicted in the historical illustrations. However, this required curated botanical metadata that is not yet available, and extracting accurate distribution data from historical texts proved to be a labour-intensive and complex task. I also explored mapping the institutional origins of the books, such as their holding museums and libraries, though this approach was less meaningful for addressing the project's research questions. As a result, the current visualisation uses an existing European plant distribution dataset sourced from contemporary scientific research. This choice highlights a central constraint of digital humanities projects: visualisation depends fundamentally on the availability and curation of data. Without substantial manual labour devoted to data creation and standardisation, meaningful spatial analysis cannot be produced.</p>

        <p>Overall, the project positions digital cultural resources not merely as repositories of digitised materials but as interpretative systems shaped by computational methods, infrastructural dependencies, and scholarly choices. By integrating transcription, computer vision, and spatial visualisation, the website demonstrates how Digital Humanities methodologies expand the scale and form of cultural analysis while simultaneously introducing new epistemological and ethical challenges. The project therefore demonstrates that digital technologies do not merely accelerate existing humanities practices but reshape the kinds of historical questions that can be asked.</p>

        <section className="meth-references">
          <h3 className="meth-references-heading">References</h3>
          <ul className="meth-references-list">
            <li>Drucker, J. (2011). Humanities approaches to graphical display. <em>Digital Humanities Quarterly</em>, <em>5</em>(1), 1–21.</li>
            <li>Du, L., Le, B., &amp; Honig, E. (2024). Probing historical image contexts: Enhancing visual archive retrieval through computer vision. <em>ACM Journal on Computing and Cultural Heritage</em>, <em>16</em>(4), 1–17.</li>
            <li>Nanjing University Digital iLab. (n.d.). <em>Digital humanities research platform.</em> <a href="https://www.digitalilab.cn/" target="_blank" rel="noreferrer">https://www.digitalilab.cn/</a></li>
            <li>Roboflow, Inc. (n.d.). <em>Roboflow</em> [Computer software]. Roboflow. <a href="https://roboflow.com" target="_blank" rel="noreferrer">https://roboflow.com</a></li>
            <li>Smits, T., &amp; Wevers, M. (2023). A multimodal turn in Digital Humanities. Using contrastive machine learning models to explore, enrich, and analyze digital visual historical collections. <em>Digital Scholarship in the Humanities</em>, <em>38</em>(3), 1267–1280.</li>
          </ul>
        </section>
      </div>
    </article>
  )
}
